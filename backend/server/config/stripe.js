import Stripe from 'stripe';
import { requireEnv } from './requiredEnv.js';

//* Fail fast - without these the billing endpoints and the webhook cannot work,
//* and a missing webhook secret would make every Stripe event fail verification
const hasStripeApiKey = requireEnv('STRIPE_API_KEY', 'refusing to start without Stripe credentials');
requireEnv('STRIPE_WEBHOOK_SECRET', 'refusing to start without webhook signature verification');

//* The SDK throws without a key, so localhost gets a placeholder that Stripe
//* rejects on use - billing calls fail while the rest of the API keeps working
//* The SDK default is an 80s timeout. The webhook sync calls Stripe while it
//* holds the company row lock inside a 20s transaction (subscriptionModel
//* SUBSCRIPTION_SYNC_TIMEOUT_MS), so a hung request must fail well within
//* that budget: 8s per attempt plus a single retry (the SDK reuses the
//* idempotency key on retries) stays under it
export const stripeInstance = new Stripe(hasStripeApiKey ? process.env.STRIPE_API_KEY : 'sk_test_unset_on_localhost', {
//   apiVersion: '2022-11-15', //* Optional
  timeout: 8000,
  maxNetworkRetries: 1,
});
