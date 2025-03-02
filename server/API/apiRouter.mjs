import { Router } from 'express';

import { paymentCompletedWebhook } from '../integrations/stripe/webhooks/paymentCompleted.mjs';
import { userRouter } from './v1/routes/userRouter.mjs';

import { authRouter } from './v1/routes/authRouter.mjs';
import { adminRouter } from './v1/routes/adminRouter.mjs';

export const apiRouter = Router();

apiRouter.use('/v1/user', userRouter);
apiRouter.use('/v1/admin', adminRouter);
apiRouter.use('/v1/auth', authRouter);

apiRouter.post('/v1/webhooks/stripeWebhooks', paymentCompletedWebhook); // ? Maybe should be changed to apiRouter.use(...) ?

apiRouter.use('/*fallback', (req, res) => {
  res.status(404).send('Route not found in apiRouter');
});
