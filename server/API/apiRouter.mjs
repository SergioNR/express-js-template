import { Router } from 'express';
import { userApi } from './v1/userApiRouter.mjs';
import { paymentCompletedWebhook } from '../integrations/stripe/webhooks/paymentCompleted.mjs';

export const apiRouter = Router();

apiRouter.use('/v1/user', userApi);

apiRouter.post('/v1/webhooks/stripeWebhooks', paymentCompletedWebhook); // ? Maybe should be changed to apiRouter.use(...) ?

apiRouter.use('/*fallback', (req, res) => {
  res.status(404).send('Route not found in apiRouter');
});
