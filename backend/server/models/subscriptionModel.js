import { prisma } from '../config/prismaClient.js';
import { stripeInstance } from '../config/stripe.js';
import { logError } from '../config/loggerFunctions.js';

//* Upsert (instead of update) so Stripe event retries and first checkout for a
//* company without a Subscription row are both handled idempotently. The row
//* is never deleted when the Stripe subscription ends - expires_at moves to
//* the end date instead, so the company keeps its row and can resubscribe
export const upsertSubscriptionInDb = async (subscriptionData) => {
  await prisma.subscription.upsert({
    where: {
      company_id: subscriptionData.companyId,
    },
    update: {
      id: subscriptionData.subscriptionId,
      expires_at: subscriptionData.expiresAt,
    },
    create: {
      id: subscriptionData.subscriptionId,
      company_id: subscriptionData.companyId,
      expires_at: subscriptionData.expiresAt,
    },
  });
};

export const getCompanyStripeIdInDb = async (companyId) => {
  const company = await prisma.company.findUnique({
    where: {
      id: companyId,
    },
    select: {
      stripe_id: true,
    },
  });

  return company?.stripe_id ?? null;
};

//* Conditional write (only while stripe_id is still null) so two concurrent
//* first checkouts cannot overwrite each other's customer id. Returns the
//* customer id that ends up stored - on a lost race that is the winner's id
export const storeBillingCompanyIdInDb = async (companyId, stripeCustomerId) => {
  const updateResult = await prisma.company.updateMany({
    where: {
      id: companyId,
      stripe_id: null,
    },
    data: {
      stripe_id: stripeCustomerId,
    },
  });

  if (updateResult.count === 1) {
    return stripeCustomerId;
  }

  return getCompanyStripeIdInDb(companyId);
};

export const getCompanyIdByStripeCustomerIdInDb = async (stripeCustomerId) => {
  const company = await prisma.company.findUnique({
    where: {
      stripe_id: stripeCustomerId,
    },
    select: {
      id: true,
    },
  });

  return company?.id ?? null;
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
//* Stripe customer id and any other Company fields. The id's existence is
//* exposed as a boolean so the client can gate portal access without ever
//* seeing the id itself
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
      Company: {
        select: {
          stripe_id: true,
        },
      },
    },
  });

  if (!subscriptionData) {
    return null;
  }

  const { Company, ...publicData } = subscriptionData;

  return {
    ...publicData,
    has_billing_id: Boolean(Company?.stripe_id),
  };
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
