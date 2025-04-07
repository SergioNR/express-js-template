import { PrismaClient } from '@prisma/client';
import { logError } from '../config/loggerFunctions.mjs';

const prisma = new PrismaClient();

export const storeTransactionInDb = async (userId /* ,  subscriptionId, transactionId */) => {
  try {
    const transaction = await prisma.subscription.create({
      data: {
        user: { connect: { id: userId } },
        plan_type: 'free',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 2592000000), // 30 days from now

        // stripe_subscription_id: 'subscriptionId',

      },
    });

    return transaction;
  } catch (error) {
    logError('Error storing transaction:', error);
    throw error;
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
