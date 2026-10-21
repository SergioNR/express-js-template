import { stripeInstance } from '../../config/stripe.js';
import { logError } from '../../config/loggerFunctions.js';

export const retrieveStripeSubscription = async (subscriptionId) => {
  const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);

  return subscription;
};

//* Stripe is the source of truth for "already subscribed" - the local row can
//* lag behind (webhook still in flight) and a second checkout would create a
//* duplicate subscription for the same customer
export const hasActiveStripeSubscription = async (stripeCustomerId) => {
  const activeSubscriptions = await stripeInstance.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  return activeSubscriptions.data.length > 0;
};

//* Best-effort cancellation at period end - a Stripe API failure must not
//* block the account deletion flow, so errors are logged and swallowed
export const cancelCompanySubscriptionInStripe = async (subscription) => {
  const stripeSubscriptionId = subscription?.id;

  //* Trial subscriptions have a random uuid as id - only `sub_` prefixed ids
  //* reference a real Stripe subscription
  if (!stripeSubscriptionId || !stripeSubscriptionId.startsWith('sub_')) {
    return;
  }

  try {
    await stripeInstance.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    logError(`Could not cancel Stripe subscription ${stripeSubscriptionId} at period end`, error);
  }
};

//* DOCS --> https://docs.stripe.com/api/subscriptions/retrieve
//* DOCS --> https://docs.stripe.com/api/subscriptions/list
//* DOCS --> https://docs.stripe.com/api/subscriptions/update
