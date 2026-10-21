import { logError, logInfo, logWarn } from '../../config/loggerFunctions.js';
import {
  getCompanyIdByStripeCustomerIdInDb,
  getSubscriptionDataInDb,
  upsertSubscriptionInDb,
} from '../../models/subscriptionModel.js';
import { stripeInstance } from '../../config/stripe.js';
import { retrieveStripeSubscription } from '../../integrations/stripe/subscription.js';

//* Statuses that grant access until the end of the current billing period
//* (past_due keeps access while Stripe retries the payment)
const ACCESS_GRANTING_STATUSES = ['active', 'trialing', 'past_due'];

//* Statuses after which the subscription no longer grants access
const ENDED_STATUSES = ['canceled', 'unpaid', 'incomplete_expired', 'paused'];

const getStripeObjectId = (value) => (typeof value === 'string' ? value : value?.id ?? null);

//* Since Stripe API 2025-03-31 the billing period lives on each subscription
//* item instead of the subscription itself. The latest item period end wins;
//* the top-level field is kept as a fallback for older pinned API versions
const getSubscriptionPeriodEnd = (subscription) => {
  const itemPeriodEnds = (subscription.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter(Boolean);

  const periodEnd = itemPeriodEnds.length > 0
    ? Math.max(...itemPeriodEnds)
    : subscription.current_period_end;

  return periodEnd ? new Date(periodEnd * 1000) : null;
};

const getSubscriptionExpiresAt = (subscription) => {
  if (ENDED_STATUSES.includes(subscription.status)) {
    return subscription.ended_at ? new Date(subscription.ended_at * 1000) : new Date();
  }

  return getSubscriptionPeriodEnd(subscription);
};

const isStoredSubscriptionReplaceable = (storedSubscription) => {
  if (!storedSubscription) {
    return true;
  }

  //* Trial rows carry a random uuid - any real Stripe subscription replaces them
  if (!storedSubscription.id?.startsWith('sub_')) {
    return true;
  }

  //* An ended Stripe subscription can be replaced by a resubscription
  const { expires_at: expiresAt } = storedSubscription;

  return !expiresAt || new Date(expiresAt) <= new Date();
};

//* Always derives the state from a fresh Stripe read instead of the event
//* payload, so out-of-order or retried deliveries converge on the current
//* state. `knownCompanyId` comes from the checkout session; for the other
//* events the company is resolved from the Stripe customer id
const syncSubscriptionFromStripe = async (subscriptionId, eventType, knownCompanyId = null) => {
  const subscription = await retrieveStripeSubscription(subscriptionId);

  const companyId = knownCompanyId
    ?? await getCompanyIdByStripeCustomerIdInDb(getStripeObjectId(subscription.customer));

  if (!companyId) {
    logWarn(`Stripe subscription ${subscription.id} has no matching company - skipping`, new Error('Company not found'), eventType);
    return;
  }

  const storedSubscription = await getSubscriptionDataInDb(companyId);
  const isSameSubscription = storedSubscription?.id === subscription.id;

  if (!isSameSubscription) {
    //* Only a subscription that grants access may take over the row - a stale
    //* event for an old (ended) subscription must not clobber the current one
    const canReplace = ACCESS_GRANTING_STATUSES.includes(subscription.status)
      && isStoredSubscriptionReplaceable(storedSubscription);

    if (!canReplace) {
      logInfo(`Ignoring ${eventType} for subscription ${subscription.id} (status ${subscription.status}) - company ${companyId} tracks a different subscription`);
      return;
    }
  }

  //* Incomplete subscriptions have not been paid yet - wait for the payment events
  if (!ACCESS_GRANTING_STATUSES.includes(subscription.status)
    && !ENDED_STATUSES.includes(subscription.status)) {
    logInfo(`Ignoring ${eventType} for subscription ${subscription.id} with status ${subscription.status}`);
    return;
  }

  //* Awaited so a DB failure surfaces as a 500 and Stripe retries the event
  //* instead of treating it as processed
  await upsertSubscriptionInDb({
    companyId,
    subscriptionId: subscription.id,
    expiresAt: getSubscriptionExpiresAt(subscription),
  });
};

const handleCheckoutSession = async (checkoutSession, eventType) => {
  const subscriptionId = getStripeObjectId(checkoutSession.subscription);

  if (!subscriptionId) {
    logWarn(`${eventType} event without subscription id - skipping`, new Error('Missing subscription id'), checkoutSession.id);
    return;
  }

  await syncSubscriptionFromStripe(subscriptionId, eventType, checkoutSession.client_reference_id);
};

const getInvoiceSubscriptionId = (invoice) => getStripeObjectId(
  invoice.parent?.subscription_details?.subscription ?? invoice.subscription,
);

const isMissingCompanyError = (error) => ['P2003', 'P2025'].includes(error?.code);

const isMissingStripeResourceError = (error) => error?.type === 'StripeInvalidRequestError'
  && error?.code === 'resource_missing';

export const stripeEventHandler = async (req, res) => {
  let event;

  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logError('error in stripe webhook signature verification', err);
    //* Generic message - verification details are not echoed back to the caller
    return res.status(400).json({
      message: 'Invalid webhook signature or payload',
    });
  }

  try {
    const eventObject = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        //* `no_payment_required` covers 100% discounts and free trials
        if (['paid', 'no_payment_required'].includes(eventObject.payment_status)) {
          await handleCheckoutSession(eventObject, event.type);
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        await handleCheckoutSession(eventObject, event.type);
        break;
      }

      case 'invoice.paid': {
        const subscriptionId = getInvoiceSubscriptionId(eventObject);

        if (subscriptionId) {
          await syncSubscriptionFromStripe(subscriptionId, event.type);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        //* Deletion keeps the row and moves expires_at to the end date, so the
        //* company can still resubscribe and reach the customer portal
        // TODO -- send an email to the user about the subscription end
        await syncSubscriptionFromStripe(eventObject.id, event.type);
        break;
      }

      default:
      // console.log('Unhandled event type:', event.type); //* Activate for debugging
    }

    return res.status(200).json({});
  } catch (error) {
    //* The company was deleted after the checkout started - retrying would
    //* never succeed, so acknowledge the event instead of looping on 500s
    if (isMissingCompanyError(error)) {
      logWarn(`Stripe event ${event.id} references a company that no longer exists - acknowledging`, error, event.type);
      return res.status(200).json({});
    }

    if (isMissingStripeResourceError(error)) {
      logWarn(`Stripe event ${event.id} references a Stripe resource that no longer exists - acknowledging`, error, event.type);
      return res.status(200).json({});
    }

    logError('error in stripeEventHandler', error);
    return res.status(500).json({});
  }
};

//* DOCS --> https://docs.stripe.com/webhooks
//* DOCS --> https://docs.stripe.com/billing/subscriptions/webhooks
