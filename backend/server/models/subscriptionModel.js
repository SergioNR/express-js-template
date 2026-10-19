import { prisma } from '../config/prismaClient.js';
// import { posthogUserSubscriptionCreated, posthogUserSubscriptionEnded } from './posthogModel.js';

export const updateSubscriptionInDb = async (checkoutSessionData) => {
  const whereClause = {
    company_id: checkoutSessionData.companyId,
  };

  await prisma.subscription.update({
    where: whereClause,
    data: {
      id: checkoutSessionData.subscriptionId,
    },
  });

  // posthogUserSubscriptionCreated(checkoutSessionData);// TODO -- fix the associated of the event
};

export const storeBillingCompanyIdInDb = async (companyId, stripeCustomerId) => {
  const whereClause = {
    id: companyId,
  };

  const user = await prisma.company.update({
    where: whereClause,
    data: {
      stripe_id: stripeCustomerId,
    },
  });

  return user;
};

export const deleteSubscriptionInDb = async (subscriptionDeletionData) => {
  const whereClause = {
    id: subscriptionDeletionData.subscriptionId,
  };

  await prisma.subscription.delete({
    where: whereClause,
  });

  // posthogUserSubscriptionEnded(subscriptionDeletionData);
};

export const getSubscriptionDataInDb = async (companyId) => {
  const whereClause = {
    company_id: companyId,
  };

  const subscriptionData = await prisma.subscription.findUnique({
    where: whereClause,
    select: {
      id: true,
      expires_at: true,
      Company: true, // TODO - improve this query to return only stripe_id
    },
  });

  return subscriptionData;
};

export const createFreeTrialSubscription = async (companyId) => {
  const createUserSubscriptionQuery = await prisma.subscription.create({
    data: {
      company_id: companyId,
      expires_at: new Date(Date.now() + 604800000), // 7 day trial
    },
  });
  return createUserSubscriptionQuery;
};
