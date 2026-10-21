import Stripe from 'stripe';

//* Fail fast - without these the billing endpoints and the webhook cannot work,
//* and a missing webhook secret would make every Stripe event fail verification
if (!process.env.STRIPE_API_KEY) {
  throw new Error('STRIPE_API_KEY environment variable is not set - refusing to start without Stripe credentials');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set - refusing to start without webhook signature verification');
}

export const stripeInstance = new Stripe(process.env.STRIPE_API_KEY, {
//   apiVersion: '2022-11-15', //* Optional
});
