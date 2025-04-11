import { stripeInstance } from '../../config/stripe.mjs';
import { logError } from '../../config/loggerFunctions.mjs';

export const createCustomerInStripe = async (email, userId) => {
  try {
    const customerCreationQuery = await stripeInstance.customers.create({
      email: email,
      metadata: {
        userId: userId,
      },
    });

    return customerCreationQuery;
  } catch (error) {
    logError('Error creating customer in Stripe:', error);
    throw error;
  }
};

//* DOCS --> https://docs.stripe.com/api/customers/create
