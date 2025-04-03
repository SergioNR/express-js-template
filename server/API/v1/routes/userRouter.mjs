import { Router } from 'express';
import { authenticationChecker } from '../../../middlewares/authenticationChecker.mjs';
import { getProfile, deleteUser } from '../../../controllers/userController.mjs';
import { checkPermissionByRole } from '../../../middlewares/permissionByRoleChecker.mjs';

export const userRouter = Router();

userRouter.get('/', (req, res) => {
  res.status(200).json({
    message: 'Route does not exist in /user/',
  });
});

userRouter.use(authenticationChecker);

userRouter.use(checkPermissionByRole('customer'));

userRouter.get('/profile', getProfile);

userRouter.delete('/delete', deleteUser);

userRouter.use('/*fallback', (req, res) => {
  res.status(404).send('requested route does not exist in /user/');
});
