import { Router } from 'express';
import {
  createCompanyBillingId,
  getBillingCustomerPortalUrl,
  getBillingCheckoutSessionUrl,
  getCompanySubscriptionData,
} from '../../../controllers/billingController.js';

export const billingRouter = Router();

billingRouter.get('/', getCompanySubscriptionData);

billingRouter.post('/', createCompanyBillingId);

billingRouter.post('/checkout-session', getBillingCheckoutSessionUrl);

billingRouter.post('/customer-portal', getBillingCustomerPortalUrl);

billingRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
