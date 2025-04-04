import { Router } from 'express';

import { stripeEventHandler } from './v1/webhooks/stripe/stripeEventHandler.mjs';
import { userRouter } from './v1/routes/userRouter.mjs';

import { authRouter } from './v1/routes/authRouter.mjs';
import { adminRouter } from './v1/routes/adminRouter.mjs';

export const apiRouter = Router();

apiRouter.use('/v1/user', userRouter);
apiRouter.use('/v1/admin', adminRouter);
apiRouter.use('/v1/auth', authRouter);

apiRouter.post('/v1/webhooks/stripe', stripeEventHandler); // ? Maybe should be changed to apiRouter.use(...) ?

apiRouter.use('/*fallback', (req, res) => {
  res.status(404).send('The requested route is not available or does not exist');
});
