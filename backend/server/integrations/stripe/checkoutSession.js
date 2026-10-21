import { stripeInstance } from '../../config/stripe.js';
import { getStripePriceId } from '../../config/planPrices.js';

//* Idempotency keys are bucketed so a double-submitted checkout request
//* replays the same Stripe call (same session) instead of opening a second
//* one, while a genuine retry after the bucket moved on gets a fresh session
export const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000;

const getIdempotencyKey = (companyId, planName, planBillingCycle, priceId) => {
  const windowBucket = Math.floor(Date.now() / IDEMPOTENCY_WINDOW_MS);

  return `checkout-${companyId}-${planName}-${planBillingCycle}-${priceId}-${windowBucket}`;
};

//* An open session can still be completed by the customer after a newer one
//* was created, which would end in two subscriptions - expiring the older
//* ones keeps at most one completable checkout per customer
export const expireOpenStripeCheckoutSessions = async (stripeCustomerId) => {
  const openSessions = await stripeInstance.checkout.sessions.list({
    customer: stripeCustomerId,
    status: 'open',
  });

  await Promise.all(openSessions.data.map((session) => stripeInstance.checkout.sessions.expire(session.id)));

  return openSessions.data.length;
};

export const createStripeCheckoutSession = async (
  companyId,
  companyStripeId,
  userId,
  planName,
  planBillingCycle,
) => {
  const priceId = getStripePriceId(planName, planBillingCycle);

  const checkoutSession = await stripeInstance.checkout.sessions.create({
    success_url: `${process.env.FRONT_WEB_APP_ORIGIN_URL}/user/billing?status=paid`,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: companyStripeId,
    customer_update: {
      name: 'auto',
      address: 'auto',
    },
    mode: 'subscription',
    cancel_url: `${process.env.FRONT_WEB_APP_ORIGIN_URL}/user/billing?status=cancelled`,
    client_reference_id: companyId,
    adaptive_pricing: {
      enabled: true,
    },
    automatic_tax: {
      enabled: true,
    },
    metadata: {
      planName: planName,
      planBillingCycle: planBillingCycle,
      userId: userId,
      companyId: companyId,
    },
    ui_mode: 'hosted',
    allow_promotion_codes: true,
    billing_address_collection: 'auto', //* Disable this for non-corporate users
    tax_id_collection: { //* Disable this for non-corporate users
      enabled: true,
    },
  }, {
    idempotencyKey: getIdempotencyKey(companyId, planName, planBillingCycle, priceId),
  });

  return checkoutSession;
};

//* Checkout Sessions are temporary. New Checkout Sessions expire after a 24 hour period.
//* The expiration time can be overwritten via the `expires_at` attribute
//* It can also be expired via the dedicated session expiration endpoint
//* DOCS --> https://docs.stripe.com/api/checkout/sessions
//* DOCS --> https://docs.stripe.com/api/checkout/sessions/list
//* DOCS --> https://docs.stripe.com/api/checkout/sessions/expire
//* DOCS --> https://docs.stripe.com/api/idempotent_requests
//* Interactive Shell --> https://docs.stripe.com/api/checkout/sessions/create?shell=true&api=true&resource=checkout%20sessions&action=create
