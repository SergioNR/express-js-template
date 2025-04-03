import { Router } from 'express';
import {
  deleteOneUserById,
  getAllCustomers,
  getOneUserById,
} from '../../../controllers/adminController.mjs';
import { authenticationChecker } from '../../../middlewares/authenticationChecker.mjs';
import { checkPermissionByRole } from '../../../middlewares/permissionByRoleChecker.mjs';

export const adminRouter = Router();

// TODO - fix authentication in tests
adminRouter.use(authenticationChecker);

adminRouter.use(checkPermissionByRole('admin'));

adminRouter.get('/', getAllCustomers);

adminRouter.get('/:userId', getOneUserById);

adminRouter.delete('/:userId', deleteOneUserById);

adminRouter.use('/*fallback', (req, res) => {
  res.send('requested route does not exist in /admin/');
});
