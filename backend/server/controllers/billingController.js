import { createStripeCustomerPortalSession } from '../integrations/stripe/customerPortalSession.js';
import { createCompanyIdInStripe } from '../integrations/stripe/customerId.js';
import { createStripeCheckoutSession } from '../integrations/stripe/checkoutSession.js';
import {
  getCompanyStripeIdInDb,
  getSubscriptionDataInDb,
  getSubscriptionPublicDataInDb,
  storeBillingCompanyIdInDb,
} from '../models/subscriptionModel.js';

//* A company is actively subscribed only through a real Stripe subscription
//* (`sub_` id) that has not expired yet - trial rows carry a random uuid
const hasActiveStripeSubscription = (subscriptionData) => Boolean(
  subscriptionData?.id?.startsWith('sub_')
  && subscriptionData.expires_at
  && new Date(subscriptionData.expires_at) > new Date(),
);

//* Creates the Stripe customer and stores it with a conditional write. When a
//* concurrent request stored a customer first, the stored id is reused
const createAndStoreCompanyStripeId = async (email, companyId) => {
  const companyBillingId = await createCompanyIdInStripe(email, companyId);

  return storeBillingCompanyIdInDb(companyId, companyBillingId.id);
};

export const createCompanyBillingId = async (req, res) => {
  const {
    email,
    company_id: companyId,
  } = req.user;

  const companyStripeId = await getCompanyStripeIdInDb(companyId);

  if (companyStripeId) {
    return res.status(409).json({
      message: 'Company already has a billing id',
    });
  }

  await createAndStoreCompanyStripeId(email, companyId);

  return res.status(201).json({});
};

export const getBillingCustomerPortalUrl = async (req, res) => {
  const {
    company_id: companyId,
  } = req.user;

  //* Only the Stripe customer is needed - the portal must stay reachable after
  //* the subscription ended so the company can see invoices and resubscribe
  const companyStripeId = await getCompanyStripeIdInDb(companyId);

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

  //* The subscription row is optional - a company whose subscription ended
  //* (or never had one) can still start a new checkout
  const subscriptionData = await getSubscriptionDataInDb(companyId);

  //* A second checkout would create a duplicate Stripe subscription - plan
  //* changes go through the customer portal instead
  if (hasActiveStripeSubscription(subscriptionData)) {
    return res.status(409).json({
      message: 'Company already has an active subscription - manage it through the customer portal',
      code: 'SUBSCRIPTION_ACTIVE',
    });
  }

  //* Auto-create the Stripe customer on first checkout - removes the need for
  //* a separate create-billing-id round trip on the client
  const companyStripeId = await getCompanyStripeIdInDb(companyId)
    ?? await createAndStoreCompanyStripeId(email, companyId);

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
