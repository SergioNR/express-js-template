import { prisma } from '../config/prismaClient.js';
import { lockCompanyForUpdateInDb } from './companyModel.js';

const subscriptionStateFields = {
  id: true,
  expires_at: true,
};

const buildSubscriptionUpsert = (subscriptionData) => ({
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

//* Upsert (instead of update) so Stripe event retries and first checkout for a
//* company without a Subscription row are both handled idempotently. The row
//* is never deleted when the Stripe subscription ends - expires_at moves to
//* the end date instead, so the company keeps its row and can resubscribe
export const upsertSubscriptionInDb = async (subscriptionData) => {
  await prisma.subscription.upsert(buildSubscriptionUpsert(subscriptionData));
};

//* The Stripe call inside the lock can take a while, so the interactive
//* transaction gets more than Prisma's 5s default before it is rolled back
const SUBSCRIPTION_SYNC_TIMEOUT_MS = 20000;

//* Serializes every subscription write of a company behind its row lock. Stripe
//* delivers events concurrently and out of order, so `resolveSubscriptionWrite`
//* runs inside the lock: it receives the currently stored row, fetches the
//* fresh Stripe state itself and returns the write to apply (or null to skip).
//* Two overlapping deliveries therefore both end up writing the latest state
//* instead of the slower one clobbering the newer one.
//* Resolves to true when a write happened
export const syncSubscriptionWithCompanyLockInDb = async (companyId, resolveSubscriptionWrite) => {
  const written = await prisma.$transaction(async (tx) => {
    await lockCompanyForUpdateInDb(tx, companyId);

    const storedSubscription = await tx.subscription.findUnique({
      where: {
        company_id: companyId,
      },
      select: subscriptionStateFields,
    });

    const subscriptionWrite = await resolveSubscriptionWrite(storedSubscription);

    if (!subscriptionWrite) {
      return false;
    }

    await tx.subscription.upsert(buildSubscriptionUpsert({
      companyId,
      subscriptionId: subscriptionWrite.subscriptionId,
      expiresAt: subscriptionWrite.expiresAt,
    }));

    return true;
  }, {
    timeout: SUBSCRIPTION_SYNC_TIMEOUT_MS,
  });

  return written;
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
      ...subscriptionStateFields,
      Company: {
        select: {
          stripe_id: true,
        },
      },
    },
  });

  return subscriptionData;
};

//* Public shape returned to clients - deliberately excludes the row id (for
//* paid subscriptions it is the internal Stripe `sub_` id), the Stripe
//* customer id and any other Company fields. Both ids are exposed as booleans
//* so the client can gate portal access and tell trials from paid plans
//* without ever seeing an id
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

  const { Company, id, ...publicData } = subscriptionData;

  return {
    ...publicData,
    is_paid: Boolean(id?.startsWith('sub_')),
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
