import { PrismaClient } from '../config/generated/prisma/client/index.js';
import { logError } from '../config/loggerFunctions.mjs';

const prisma = new PrismaClient();

export const storeSubscriptionInDb = async (subscriptionData) => {
  try {
    await prisma.subscription.create({
      data: {
        user: {
          connect: {
            stripe_customer_id: subscriptionData.customer,
          },
        },
        plan_name: subscriptionData.planType || 'basic',
        status: subscriptionData.status,

      },
    });
  } catch (error) {
    logError('Error storing transaction:', error);
  }
};

export const storeStripeCustomerIdInDb = async (userId, stripeCustomerId) => {
  try {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripe_customer_id: stripeCustomerId,
      },
    });

    return user;
  } catch (error) {
    logError('Error storing Stripe customer ID:', error);
    throw error;
  }
};

export const markSubscriptionAsCancelledInDb = async (cancelData) => {
  try {
    await prisma.subscription.update({
      where: {
        stripe_subscription_id: cancelData.id,
      },
      data: {
        status: 'cancelled',
        current_period_end_date: new Date(cancelData.cancelAt * 1000),
      },
    });
  } catch (error) {
    logError('error marking subscription as cancelled', error);
  }
};

export const getSubscriptionDataInDb = async (userId) => {
  try {
    const subscriptionData = await prisma.subscription.findFirst({
      where: {
        AND: [
          {
            user_id: userId,
          },
          {
            status: 'active',
          },
        ],
      },
      select: {
        status: true,
        plan_name: true,
      },
    });

    return subscriptionData;
  } catch (error) {
    logError('error checking for active subscriptions', error);
    throw error;
  }
};
