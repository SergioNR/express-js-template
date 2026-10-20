import { prisma } from '../config/prismaClient.js';
import { stripeInstance } from '../config/stripe.js';
import { logError } from '../config/loggerFunctions.js';

//* Upsert (instead of update) so Stripe event retries and first checkout for a
//* company without a Subscription row are both handled idempotently
export const upsertSubscriptionInDb = async (checkoutSessionData) => {
  await prisma.subscription.upsert({
    where: {
      company_id: checkoutSessionData.companyId,
    },
    update: {
      id: checkoutSessionData.subscriptionId,
    },
    create: {
      id: checkoutSessionData.subscriptionId,
      company_id: checkoutSessionData.companyId,
    },
  });
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

//* deleteMany (instead of delete) so repeated Stripe delivery attempts of
//* `customer.subscription.deleted` do not fail on an already-deleted row
export const deleteSubscriptionInDb = async (subscriptionDeletionData) => {
  await prisma.subscription.deleteMany({
    where: {
      id: subscriptionDeletionData.subscriptionId,
    },
  });
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
      Company: {
        select: {
          stripe_id: true,
        },
      },
    },
  });

  return subscriptionData;
};

//* Public shape returned to clients - deliberately excludes the internal
//* Stripe customer id and any other Company fields
export const getSubscriptionPublicDataInDb = async (companyId) => {
  const subscriptionData = await prisma.subscription.findUnique({
    where: {
      company_id: companyId,
    },
    select: {
      id: true,
      expires_at: true,
      created_at: true,
      updated_at: true,
    },
  });

  return subscriptionData;
};

export const deleteSubscriptionByCompanyId = async (companyId) => {
  await prisma.subscription.deleteMany({
    where: {
      company_id: companyId,
    },
  });
};

export const countTotalSubscriptionsInDb = async () => {
  const totalSubscriptionCount = await prisma.subscription.count();

  return totalSubscriptionCount;
};

//* Mirrors the client-side definition of an active subscription:
//* an existing `expires_at` in the future (null counts as inactive)
export const countActiveSubscriptionsInDb = async () => {
  const activeSubscriptionCount = await prisma.subscription.count({
    where: {
      expires_at: {
        gt: new Date(),
      },
    },
  });

  return activeSubscriptionCount;
};

//* Best-effort cancellation at period end - a Stripe API failure must not
//* block the account deletion flow, so errors are logged and swallowed
export const cancelCompanySubscriptionInStripe = async (subscription) => {
  const stripeSubscriptionId = subscription?.id;

  //* Trial subscriptions have a random uuid as id - only `sub_` prefixed ids
  //* reference a real Stripe subscription
  if (!stripeSubscriptionId || !stripeSubscriptionId.startsWith('sub_')) {
    return;
  }

  try {
    await stripeInstance.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    logError(`Could not cancel Stripe subscription ${stripeSubscriptionId} at period end`, error);
  }
};
