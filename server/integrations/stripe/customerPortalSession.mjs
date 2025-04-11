import { stripeInstance } from '../../config/stripe.mjs';
import { logError } from '../../config/loggerFunctions.mjs';

export const createStripeCustomerPortalSession = async (stripeCustomerId) => {
  try {
    const customerPortalSession = await stripeInstance.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.FRONT_WEB_APP_ORIGIN_URL}/user/billing`,
    });
    return customerPortalSession;
  } catch (error) {
    logError('Error creating customer portal session:', error);
    throw error;
  }
};

//* Portal sessions are temporary. New portal sessions expire after a 5 minute period.
//* If a customer uses it within that time period, the session expires
//* within 1 hour of the most recent activity.

//* DOCS --> https://docs.stripe.com/api/customer_portal/sessions/create
