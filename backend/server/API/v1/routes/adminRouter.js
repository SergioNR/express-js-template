import { Router } from 'express';
import {
  deleteOneUserById,
  getAllUsers,
  getOneUserById,
} from '../../../controllers/adminController.js';
import { checkPermissionByRole } from '../../../middlewares/permissionByRoleChecker.js';

export const adminRouter = Router();

adminRouter.use(checkPermissionByRole('admin'));

adminRouter.get('/', getAllUsers);

adminRouter.get('/:userId', getOneUserById);

adminRouter.delete('/:userId', deleteOneUserById);

adminRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
