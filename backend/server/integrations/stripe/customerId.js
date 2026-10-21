import { stripeInstance } from '../../config/stripe.js';

export const createCompanyIdInStripe = async (email, companyId) => {
  const customerCreationQuery = await stripeInstance.customers.create({
    email: email,
    metadata: {
      companyId: companyId,
    },
  }, {
    //* Concurrent first checkouts of the same company replay the same request
    //* and get back the same customer instead of creating duplicates
    //* (Stripe keeps idempotency keys for 24h)
    idempotencyKey: `company-customer-${companyId}`,
  });

  return customerCreationQuery;
};

//* DOCS --> https://docs.stripe.com/api/customers/create
//* DOCS --> https://docs.stripe.com/api/idempotent_requests
