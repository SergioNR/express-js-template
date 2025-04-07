import { Router } from 'express';
import { checkPermissionByRole } from '../../../middlewares/permissionByRoleChecker.mjs';
import { createStripeCustomerId, getStripeCustomerPortalUrl, getStripeCheckoutSessionUrl } from '../../../controllers/stripeController.mjs';

export const stripeRouter = Router();

// TODO - fix authentication in tests

stripeRouter.use(checkPermissionByRole('customer'));

stripeRouter.post('/create-stripe-customer-id', createStripeCustomerId);

stripeRouter.post('/stripe-checkout-session', getStripeCheckoutSessionUrl);

stripeRouter.post('/stripe-customer-portal', getStripeCustomerPortalUrl);

stripeRouter.use('/*fallback', (req, res) => {
  res.status(404).send('The requested route is not available or does not exist'); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
