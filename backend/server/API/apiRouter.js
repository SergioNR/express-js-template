import { Router } from 'express';

import { userRouter } from './v1/routes/userRouter.js';
import { authRouter } from './v1/routes/authRouter.js';
import { adminRouter } from './v1/routes/adminRouter.js';
import { billingRouter } from './v1/routes/billingRouter.js';
import { checkAuthentication } from '../middlewares/authenticationChecker.js';
import { checkPermissionByRole } from '../middlewares/permissionByRoleChecker.js';

export const apiRouter = Router();

const userRole = 'user';
const adminRole = 'admin';

apiRouter.use('/v1/auth', authRouter);

apiRouter.use(
  '/v1/billing',
  checkAuthentication(),
  checkPermissionByRole(userRole),
  billingRouter,
);

apiRouter.use(
  '/v1/user',
  checkAuthentication(),
  checkPermissionByRole(userRole),
  userRouter,
);

apiRouter.use(
  '/v1/admin',
  checkAuthentication(),
  checkPermissionByRole(adminRole),
  adminRouter,
);

apiRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
