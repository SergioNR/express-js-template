import { createHash } from 'crypto';
import { stripeInstance } from '../../config/stripe.js';

//* Stripe rejects a replayed idempotency key whose request body differs. The
//* email is part of the body, so a short digest of it goes into the key: the
//* same company + email replays safely, a changed email gets a fresh key
const getEmailDigest = (email) => createHash('sha256').update(email).digest('hex').slice(0, 12);

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
    idempotencyKey: `company-customer-${companyId}-${getEmailDigest(email)}`,
  });

  return customerCreationQuery;
};

//* DOCS --> https://docs.stripe.com/api/customers/create
//* DOCS --> https://docs.stripe.com/api/idempotent_requests
