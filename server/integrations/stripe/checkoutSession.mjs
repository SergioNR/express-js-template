import { logError } from '../../config/loggerFunctions.mjs';
import { stripeInstance } from '../../config/stripe.mjs';

export const createStripeCheckoutSession = async (stripeCustomerId, internalUserId, planType) => {
  let price;

  switch (planType) {
    case 'monthly':
      price = process.env.STRIPE_MONTHLY_PRICE_ID;
      break;
    case 'biannual':
      price = process.env.STRIPE_BIANNUAL_PRICE_ID;
      break;
    case 'annual':
      price = process.env.STRIPE_ANNUAL_PRICE_ID;
      break;
    default:
      price = process.env.STRIPE_MONTHLY_PRICE_ID; // Default to monthly if no plan type is provided
      logError('No plan type provided. Defaulting to monthly.');
      break;
  }

  try {
    const checkoutSession = await stripeInstance.checkout.sessions.create({
      success_url: `${process.env.FRONT_WEB_APP_ORIGIN_URL}/user/billing?status=paid`,
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      mode: 'subscription',
      cancel_url: `${process.env.FRONT_WEB_APP_ORIGIN_URL}/user/billing?status=cancelled`,
      client_reference_id: internalUserId,
      adaptive_pricing: {
        enabled: true,
      },
      automatic_tax: {
        enabled: true,
      },

      metadata: {
        userId: internalUserId,
      },
      customer: stripeCustomerId,
      ui_mode: 'hosted',
      allow_promotion_codes: true,
      billing_address_collection: 'auto', //* Disable this for non-corporate users
      tax_id_collection: { //* Disable this for non-corporate users
        enabled: true,
      },
    });

    return checkoutSession;
  } catch (error) {
    logError('Error creating checkout session:', error);
    throw error;
  }
};

//* Checkout Sessions are temporary. New Checkout Sessions expire after a 24 hour period.
//* The expiration time can be overwritten via the `expires_at` attribute
//* It can also be expired via the dedicated session expiration endpoint
