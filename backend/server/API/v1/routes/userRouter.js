import { Router } from 'express';
import { getUserProfile, deleteUser } from '../../../controllers/userController.js';

export const userRouter = Router();

userRouter.get('/', getUserProfile);

userRouter.delete('/', deleteUser);

userRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
