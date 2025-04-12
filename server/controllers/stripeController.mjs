import { logError } from '../config/loggerFunctions.mjs';
import { createStripeCustomerPortalSession } from '../integrations/stripe/customerPortalSession.mjs';
import { createCustomerInStripe } from '../integrations/stripe/customer.mjs';
import { createStripeCheckoutSession } from '../integrations/stripe/checkoutSession.mjs';
import { getSubscriptionDataInDb, storeStripeCustomerIdInDb } from '../models/subscriptionModel.mjs';

export const createStripeCustomerId = async (req, res) => {
  const {
    email,
    id: userId,
    stripe_customer_id: stripeCustomerId, //* Returns null if customer does not exist Stripe
  } = req.user;

  if (stripeCustomerId) {
    return res.status(200).json({
      success: false,
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
      success: true,
      message: 'Customer created successfully',
      stripeCustomerId: createdStripeCustomerId,
    });
  } catch (error) {
    logError('Error creating customer in Stripe:', error);

    return res.status(500).json({
      success: false,
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
      success: 'success',
      message: 'Customer portal URL retrieved successfully',
      customerPortalUrl: url,
    });
  } catch (error) {
    logError('Error creating customer portal session:', error);
    return res.status(500).json({
      success: false,
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
    const { requestedBillingCycle: billingCycle } = req.body;

    const activeSubscription = await getSubscriptionDataInDb(internalUserId);

    if (activeSubscription) {
      const error = new Error('user tried to create an checkout session with an active subscriptions - should be blocked in the FE');
      error.name = 'Create checkout session error';

      logError('user tried to create a checkout session with an active subscription', error);

      return res.status(403).json({
        success: false,
        message: 'Checkout Session cant be created - user already has a subscription',
      });
    }

    const checkoutSession = await createStripeCheckoutSession(
      stripeCustomerId,
      internalUserId,
      billingCycle,
    );

    const { url } = checkoutSession;

    return res.status(200).json({
      success: true,
      message: 'Stripe`s checkout session generated successfully',
      checkoutSessionUrl: url,
    });
  } catch (error) {
    logError('Error creating Stripe`s checkout session:', error);
    return res.status(500).json({
      success: false,
      message: 'There was an error creating the checkout session',
    });
  }
};

export const getSubscriptionData = async (req, res) => {
  const { id } = req.user;

  try {
    const subscriptionData = await getSubscriptionDataInDb(id);

    res.status(200).json({
      success: true,
      message: 'Successfully fetched user subscriptions',
      subscriptionData: subscriptionData,
    });
  } catch (error) {
    logError('error checking for active subscriptions', error);
    res.status(500).json({
      success: false,
      message: 'There was an error checking for active subscriptions',
    });
  }
};
