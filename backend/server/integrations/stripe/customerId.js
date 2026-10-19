import { stripeInstance } from '../../config/stripe.js';

export const createCompanyIdInStripe = async (email, companyId) => {
  const customerCreationQuery = await stripeInstance.customers.create({
    email: email,
    metadata: {
      companyId: companyId,
    },
  });

  return customerCreationQuery;
};

//* DOCS --> https://docs.stripe.com/api/customers/create
