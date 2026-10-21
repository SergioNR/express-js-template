import { logError, logInfo, logWarn } from '../../config/loggerFunctions.js';
import {
  getCompanyIdByStripeCustomerIdInDb,
  syncSubscriptionWithCompanyLockInDb,
} from '../../models/subscriptionModel.js';
import { stripeInstance } from '../../config/stripe.js';
import { retrieveStripeSubscription } from '../../integrations/stripe/subscription.js';

//* Statuses that grant access until the end of the current billing period
//* (past_due keeps access while Stripe retries the payment)
const ACCESS_GRANTING_STATUSES = ['active', 'trialing', 'past_due'];

//* Statuses after which the subscription no longer grants access
const ENDED_STATUSES = ['canceled', 'unpaid', 'incomplete_expired', 'paused'];

const getStripeObjectId = (value) => (typeof value === 'string' ? value : value?.id ?? null);

//* Stripe ids are internal - alerts only carry enough of them to find the
//* objects in the dashboard, never the full id
const redactStripeId = (stripeId) => (stripeId ? `${stripeId.slice(0, 4)}...${stripeId.slice(-4)}` : 'none');

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

const isStoredSubscriptionActive = (storedSubscription) => Boolean(
  storedSubscription?.id?.startsWith('sub_')
  && storedSubscription.expires_at
  && new Date(storedSubscription.expires_at) > new Date(),
);

//* Trial rows (random uuid) and ended Stripe subscriptions can be replaced by
//* a new subscription - an active Stripe subscription cannot
const isStoredSubscriptionReplaceable = (storedSubscription) => !isStoredSubscriptionActive(storedSubscription);

//* Decides, with the company row locked and the stored row in hand, what to
//* write for the subscription. Returns the write for the model or null to skip
const resolveSubscriptionWrite = async (subscriptionId, storedSubscription, eventType, companyId) => {
  //* Fetched inside the lock so the latest Stripe state always wins - two
  //* overlapping deliveries both converge on it regardless of event order
  const subscription = await retrieveStripeSubscription(subscriptionId);
  const isSameSubscription = storedSubscription?.id === subscription.id;

  if (!isSameSubscription) {
    //* Only a subscription that grants access may take over the row - a stale
    //* event for an old (ended) subscription must not clobber the current one
    const canReplace = ACCESS_GRANTING_STATUSES.includes(subscription.status)
      && isStoredSubscriptionReplaceable(storedSubscription);

    if (!canReplace) {
      //* Two subscriptions granting access at once means the customer is
      //* being billed twice - that needs a human, so it is alerted, not ignored
      if (ACCESS_GRANTING_STATUSES.includes(subscription.status)) {
        logError(
          `Company ${companyId} has an active subscription ${redactStripeId(storedSubscription.id)} but Stripe reports another access-granting subscription ${redactStripeId(subscription.id)} (${eventType}, status ${subscription.status}) - possible double billing`,
          new Error('Duplicate active Stripe subscription'),
          eventType,
        );
        return null;
      }

      logInfo(`Ignoring ${eventType} for subscription ${redactStripeId(subscription.id)} (status ${subscription.status}) - company ${companyId} tracks a different subscription`);
      return null;
    }
  }

  //* Incomplete subscriptions have not been paid yet - wait for the payment events
  if (!ACCESS_GRANTING_STATUSES.includes(subscription.status)
    && !ENDED_STATUSES.includes(subscription.status)) {
    logInfo(`Ignoring ${eventType} for subscription ${redactStripeId(subscription.id)} with status ${subscription.status}`);
    return null;
  }

  return {
    subscriptionId: subscription.id,
    expiresAt: getSubscriptionExpiresAt(subscription),
  };
};

//* Resolves the company before taking its lock. The checkout session carries
//* the company id directly; the other events carry the Stripe customer id.
//* Falls back to a Stripe read for payloads that carry neither
const resolveCompanyId = async (subscriptionId, knownCompanyId, stripeCustomerId) => {
  if (knownCompanyId) {
    return knownCompanyId;
  }

  const customerId = stripeCustomerId
    ?? getStripeObjectId((await retrieveStripeSubscription(subscriptionId)).customer);

  return getCompanyIdByStripeCustomerIdInDb(customerId);
};

//* Always derives the state from a fresh Stripe read (taken under the company
//* lock) instead of the event payload, so out-of-order or retried deliveries
//* converge on the current state
const syncSubscriptionFromStripe = async (subscriptionId, eventType, {
  knownCompanyId = null,
  stripeCustomerId = null,
} = {}) => {
  const companyId = await resolveCompanyId(subscriptionId, knownCompanyId, stripeCustomerId);

  if (!companyId) {
    logWarn(`Stripe subscription ${redactStripeId(subscriptionId)} has no matching company - skipping`, new Error('Company not found'), eventType);
    return;
  }

  //* Awaited so a DB failure surfaces as a 500 and Stripe retries the event
  //* instead of treating it as processed
  await syncSubscriptionWithCompanyLockInDb(
    companyId,
    (storedSubscription) => resolveSubscriptionWrite(subscriptionId, storedSubscription, eventType, companyId),
  );
};

const handleCheckoutSession = async (checkoutSession, eventType) => {
  const subscriptionId = getStripeObjectId(checkoutSession.subscription);

  if (!subscriptionId) {
    logWarn(`${eventType} event without subscription id - skipping`, new Error('Missing subscription id'), checkoutSession.id);
    return;
  }

  await syncSubscriptionFromStripe(subscriptionId, eventType, {
    knownCompanyId: checkoutSession.client_reference_id,
    stripeCustomerId: getStripeObjectId(checkoutSession.customer),
  });
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
    //* Anyone can POST garbage to a public webhook URL - a bad signature is
    //* noise to log, not an incident to page on
    logWarn('Stripe webhook signature verification failed', err, { ip: req.ip });
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
          await syncSubscriptionFromStripe(subscriptionId, event.type, {
            stripeCustomerId: getStripeObjectId(eventObject.customer),
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        //* Deletion keeps the row and moves expires_at to the end date, so the
        //* company can still resubscribe and reach the customer portal
        // TODO -- send an email to the user about the subscription end
        await syncSubscriptionFromStripe(eventObject.id, event.type, {
          stripeCustomerId: getStripeObjectId(eventObject.customer),
        });
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
