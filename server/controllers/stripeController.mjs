import { logError } from '../config/loggerFunctions.mjs';
import { createStripeCustomerPortalSession } from '../integrations/stripe/customerPortalSession.mjs';
import { createCustomerInStripe } from '../integrations/stripe/customer.mjs';
import { createStripeCheckoutSession } from '../integrations/stripe/checkoutSession.mjs';
import { storeStripeCustomerIdInDb } from '../models/subscriptionModel.mjs';

export const createStripeCustomerId = async (req, res) => {
  const {
    email,
    id: userId,
    stripe_customer_id: stripeCustomerId, //* Returns null if customer does not exist Stripe
  } = req.user;

  if (stripeCustomerId) {
    return res.status(200).json({
      status: 'false',
      message: 'Customer already exists',
      stripeCustomerId: stripeCustomerId,
    });
  }

  try {
    const customerCreationQuery = await createCustomerInStripe(email, userId);

    const { id: createdStripeCustomerId } = customerCreationQuery;

    await storeStripeCustomerIdInDb(
      userId,
      customerCreationQuery.id,
    );

    return res.status(200).json({
      status: 'success',
      message: 'Customer created successfully',
      stripeCustomerId: createdStripeCustomerId,
    });
  } catch (error) {
    logError('Error creating customer in Stripe:', error);

    return res.status(500).json({
      success: 'false',
      message: 'There was an error creating the billing sections in stripe in Stripe',
    });
  }
};

export const getStripeCustomerPortalUrl = async (req, res) => {
  try {
    const {
      stripe_customer_id: stripeCustomerId,
    } = req.user;

    const customerPortalCreationQuery = await createStripeCustomerPortalSession(stripeCustomerId);

    const { url } = customerPortalCreationQuery;

    return res.status(200).json({
      status: 'success',
      message: 'Customer portal URL retrieved successfully',
      customerPortalUrl: url,
    });
  } catch (error) {
    logError('Error creating customer portal session:', error);
    return res.status(500).json({
      success: 'false',
      message: 'There was an error creating the customer portal session',
    });
  }
};

export const getStripeCheckoutSessionUrl = async (req, res) => {
  try {
    const {
      stripe_customer_id: stripeCustomerId,
      id: internalUserId,
    } = req.user;
    const { requestedPlanType: planType } = req.body;

    const checkoutSession = await createStripeCheckoutSession(
      stripeCustomerId,
      internalUserId,
      planType,
    );

    const { url } = checkoutSession;

    return res.status(200).json({
      status: 'success',
      message: 'Stripe`s checkout session generated successfully',
      checkoutSessionUrl: url,
    });
  } catch (error) {
    logError('Error creating Stripe`s checkout session:', error);
    return res.status(500).json({
      success: 'false',
      message: 'There was an error creating the customer portal session',
    });
  }
};
