import { Router } from 'express';

import { userRouter } from './v1/routes/userRouter.js';
import { authRouter } from './v1/routes/authRouter.js';
import { adminRouter } from './v1/routes/adminRouter.js';
import { billingRouter } from './v1/routes/billingRouter.js';
import { teamRouter } from './v1/routes/teamRouter.js';
import { filesRouter } from './v1/routes/filesRouter.js';
import { checkAuthentication } from '../middlewares/authenticationChecker.js';
import { checkPermissionByRole } from '../middlewares/permissionByRoleChecker.js';
import { isS3Configured } from '../config/s3.js';
import { logWarn } from '../config/loggerFunctions.js';

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

//* Team routes are open to every authenticated global role - the fine-grained
//* company permission checks happen per route inside teamRouter
apiRouter.use(
  '/v1/team',
  checkAuthentication(),
  teamRouter,
);

apiRouter.use(
  '/v1/admin',
  checkAuthentication(),
  checkPermissionByRole(adminRole),
  adminRouter,
);

//* File storage is an optional feature - without S3_BUCKET the router is
//* never mounted and /api/v1/files falls through to the fallback 404 below
if (isS3Configured()) {
  apiRouter.use(
    '/v1/files',
    checkAuthentication(),
    filesRouter,
  );
} else {
  logWarn('S3 storage is not configured - /api/v1/files endpoints are disabled', new Error('S3_BUCKET is not set'));
}

apiRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
