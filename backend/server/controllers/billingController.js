import { createStripeCustomerPortalSession } from '../integrations/stripe/customerPortalSession.js';
import { createCompanyIdInStripe } from '../integrations/stripe/customerId.js';
import { createStripeCheckoutSession } from '../integrations/stripe/checkoutSession.js';
import { getSubscriptionDataInDb, storeBillingCompanyIdInDb } from '../models/subscriptionModel.js';

export const createCompanyBillingId = async (createdUser) => {
  const {
    email,
    company_id: companyId,
  } = createdUser;

  const subcriptionData = await getSubscriptionDataInDb(companyId);

  const { stripe_id: companyStripeId } = subcriptionData;

  if (companyStripeId) {
    throw new Error(`Company ${companyId} already has a billing Id`);
  }

  const companyBillingId = await createCompanyIdInStripe(email, companyId);

  await storeBillingCompanyIdInDb(
    companyId,
    companyBillingId.id,
  );
};

export const getBillingCustomerPortalUrl = async (req, res) => {
  const {
    company_id: companyId,
  } = req.user;

  const subcriptionData = await getSubscriptionDataInDb(companyId);

  const { stripe_id: companyStripeId } = subcriptionData.Company;

  const customerPortalCreationQuery = await createStripeCustomerPortalSession(companyStripeId);

  const { url } = customerPortalCreationQuery;

  return res.status(200).json({
    success: 'success',
    message: 'Customer portal URL retrieved successfully',
    customerPortalUrl: url,
  });
};

export const getBillingCheckoutSessionUrl = async (req, res) => {
  const {
    company_id: companyId,
    id: userId,
  } = req.user;

  const subcriptionData = await getSubscriptionDataInDb(companyId);

  const { stripe_id: companyStripeId } = subcriptionData.Company;

  const { planName, planBillingCycle } = req.body;

  const checkoutSession = await createStripeCheckoutSession(
    companyId,
    companyStripeId,
    userId,
    planName,
    planBillingCycle,
  );

  const { url } = checkoutSession;

  return res.status(200).json({
    success: true,
    message: 'Billing checkout session generated successfully',
    checkoutSessionUrl: url,
  });
};

export const getCompanySubscriptionData = async (req, res) => {
  const { company_id: companyId } = req.user;

  const subcriptionData = await getSubscriptionDataInDb(companyId);

  return res.status(200).json({
    success: true,
    message: 'Billing data retrieved successfully - DB',
    subscriptionData: subcriptionData,
  });
};
