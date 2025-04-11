import Stripe from 'stripe';

export const stripeInstance = new Stripe(process.env.STRIPE_API_KEY, {
//   apiVersion: '2022-11-15', //* Optional
});
