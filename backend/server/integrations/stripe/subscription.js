import { stripeInstance } from '../../config/stripe.js';

export const retrieveStripeSubscription = async (subscriptionId) => {
  const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);

  return subscription;
};

//* DOCS --> https://docs.stripe.com/api/subscriptions/retrieve
