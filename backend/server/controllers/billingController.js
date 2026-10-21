import { createStripeCustomerPortalSession } from '../integrations/stripe/customerPortalSession.js';
import { createCompanyIdInStripe } from '../integrations/stripe/customerId.js';
import { createStripeCheckoutSession } from '../integrations/stripe/checkoutSession.js';
import {
  getSubscriptionDataInDb,
  getSubscriptionPublicDataInDb,
  storeBillingCompanyIdInDb,
} from '../models/subscriptionModel.js';

export const createCompanyBillingId = async (req, res) => {
  const {
    email,
    company_id: companyId,
  } = req.user;

  const subscriptionData = await getSubscriptionDataInDb(companyId);

  if (!subscriptionData) {
    return res.status(404).json({
      message: 'No subscription found for the company',
    });
  }

  const { stripe_id: companyStripeId } = subscriptionData.Company;

  if (companyStripeId) {
    return res.status(409).json({
      message: 'Company already has a billing id',
    });
  }

  const companyBillingId = await createCompanyIdInStripe(email, companyId);

  await storeBillingCompanyIdInDb(
    companyId,
    companyBillingId.id,
  );

  return res.status(201).json({});
};

export const getBillingCustomerPortalUrl = async (req, res) => {
  const {
    company_id: companyId,
  } = req.user;

  const subscriptionData = await getSubscriptionDataInDb(companyId);

  if (!subscriptionData) {
    return res.status(404).json({
      message: 'No subscription found for the company',
    });
  }

  const companyStripeId = subscriptionData.Company?.stripe_id;

  if (!companyStripeId) {
    return res.status(409).json({
      message: 'Company has no billing id yet - start a checkout first',
    });
  }

  const customerPortalCreationQuery = await createStripeCustomerPortalSession(companyStripeId);

  const { url } = customerPortalCreationQuery;

  return res.status(200).json({
    customerPortalUrl: url,
  });
};

export const getBillingCheckoutSessionUrl = async (req, res) => {
  const {
    email,
    company_id: companyId,
    id: userId,
  } = req.user;

  const { planName, planBillingCycle } = req.body;

  const subscriptionData = await getSubscriptionDataInDb(companyId);

  if (!subscriptionData) {
    return res.status(404).json({
      message: 'No subscription found for the company',
    });
  }

  let companyStripeId = subscriptionData.Company?.stripe_id;

  //* Auto-create the Stripe customer on first checkout - removes the need for
  //* a separate create-billing-id round trip on the client
  if (!companyStripeId) {
    const companyBillingId = await createCompanyIdInStripe(email, companyId);

    companyStripeId = companyBillingId.id;

    await storeBillingCompanyIdInDb(companyId, companyStripeId);
  }

  const checkoutSession = await createStripeCheckoutSession(
    companyId,
    companyStripeId,
    userId,
    planName,
    planBillingCycle,
  );

  const { url } = checkoutSession;

  return res.status(200).json({
    checkoutSessionUrl: url,
  });
};

export const getCompanySubscriptionData = async (req, res) => {
  const { company_id: companyId } = req.user;

  //* Public shape - the internal Stripe customer id is never exposed
  const subscriptionData = await getSubscriptionPublicDataInDb(companyId);

  if (!subscriptionData) {
    return res.status(404).json({
      message: 'No subscription found for the company',
    });
  }

  return res.status(200).json({
    subscriptionData: subscriptionData,
  });
};
