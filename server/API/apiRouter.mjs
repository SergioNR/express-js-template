import { Router } from 'express';

import { stripeEventHandler } from './v1/webhooks/stripe/stripeEventHandler.mjs';
import { userRouter } from './v1/routes/userRouter.mjs';

import { authRouter } from './v1/routes/authRouter.mjs';
import { adminRouter } from './v1/routes/adminRouter.mjs';
import { stripeRouter } from './v1/routes/stripeRouter.mjs';
import { authenticationChecker } from '../middlewares/authenticationChecker.mjs';

export const apiRouter = Router();

apiRouter.post('/v1/webhooks/stripe', stripeEventHandler);

// Auth protected routes
apiRouter.use(authenticationChecker);

apiRouter.use('/v1/auth', authRouter);
apiRouter.use('/v1/stripe', stripeRouter);
apiRouter.use('/v1/user', userRouter);

apiRouter.use('/v1/admin', adminRouter);

apiRouter.use('/*fallback', (req, res) => {
  res.status(404).send('The requested route is not available or does not exist');
}); //* Will catch failed requests even though they are authenticated
