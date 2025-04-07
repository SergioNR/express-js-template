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

// { //* Checkout object example
//   "id": "cs_test_b1lrdJPwQUNMccm6CJyBj58I98ABhwK7NFvKNzQe15r62Bg6PKOjOwnFZZ",
//   "object": "checkout.session",
//   "adaptive_pricing": null,
//   "after_expiration": null,
//   "allow_promotion_codes": true,
//   "amount_subtotal": 6600,
//   "amount_total": 6600,
//   "automatic_tax": { "enabled": true, "liability": { "type": "self" }, "status": "complete" },
//   "billing_address_collection": "auto",
//   "cancel_url": "https://example.com/cancel",
//   "client_reference_id": null,
//   "client_secret": null,
//   "collected_information": { "shipping_details": null },
//   "consent": null,
//   "consent_collection": null,
//   "created": 1743890504,
//   "currency": "eur",
//   "currency_conversion": null,
//   "custom_fields": [],
//   "custom_text": {
//       "after_submit": null,
//       "shipping_address": null,
//       "submit": null,
//       "terms_of_service_acceptance": null
//   },
//   "customer": "cus_S4TYGWgtRlRUeM",
//   "customer_creation": null,
//   "customer_details": {
//       "address": {
//           "city": null,
//           "country": "ES",
//           "line1": null,
//           "line2": null,
//           "postal_code": null,
//           "state": null
//       },
//       "email": "jennyrosen@example.com",
//       "name": "fakecompany",
//       "phone": null,
//       "tax_exempt": "none",
//       "tax_ids": [ "[Object]" ]
//   },
//   "customer_email": null,
//   "discounts": [],
//   "expires_at": 1743976904,
//   "invoice": "in_1RAemoKwyQnTsu7pabDekHJg",
//   "invoice_creation": null,
//   "livemode": false,
//   "locale": null,
//   "metadata": { "userId": "1ca1caf3-0106-499f-960d-38578af19056" },
//   "mode": "subscription",
//   "payment_intent": null,
//   "payment_link": null,
//   "payment_method_collection": "always",
//   "payment_method_configuration_details": { "id": "pmc_1ND3bkKwyQnTsu7pNgmJgtw3", "parent": null },
//   "payment_method_options": { "card": { "request_three_d_secure": "automatic" } },
//   "payment_method_types": [ "card", "link" ],
//   "payment_status": "paid",
//   "permissions": null,
//   "phone_number_collection": { "enabled": false },
//   "recovered_from": null,
//   "saved_payment_method_options": {
//       "allow_redisplay_filters": [ "always" ],
//       "payment_method_remove": null,
//       "payment_method_save": null
//   },
//   "setup_intent": null,
//   "shipping_address_collection": null,
//   "shipping_cost": null,
//   "shipping_details": null,
//   "shipping_options": [],
//   "status": "complete",
//   "submit_type": null,
//   "subscription": "sub_1RAemoKwyQnTsu7p8SYZkKZN",
//   "success_url": "https://example.com/success",
//   "tax_id_collection": { "enabled": true, "required": "never" },
//   "total_details": { "amount_discount": 0, "amount_shipping": 0, "amount_tax": 1145 },
//   "ui_mode": "hosted",
//   "url": null,
//   "wallet_options": null
// }
