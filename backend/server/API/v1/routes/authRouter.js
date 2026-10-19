import { Router } from 'express';
import { checkSchema } from 'express-validator';
import {
  createUserInDb,
  updateUserPassword,
  checkSession,
  requestPasswordResetToken,
  loginLocal,
  checkPasswordResetTokenValidity,
  updateRecoveredUserPassword,
  logoutUser,
} from '../../../controllers/authController.js';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.js';
import { createUserValidationSchema } from '../../../utils/validators/createUserSchema.js';
import { userLoginValidationSchema } from '../../../utils/validators/userLoginValidationSchema.js';

import { updatePasswordSchema } from '../../../utils/validators/updatePasswordSchema.js';
import { recoverPasswordSchema } from '../../../utils/validators/recoverPasswordSchema.js';
import { checkAuthentication } from '../../../middlewares/authenticationChecker.js';
import { requestNewPasswordSchema } from '../../../utils/validators/requestNewPasswordSchema.js';

export const authRouter = Router();

authRouter.post('/login/local', checkSchema(userLoginValidationSchema), sanitizerResult, loginLocal);

authRouter.post('/register/local/user', checkSchema(createUserValidationSchema), sanitizerResult, createUserInDb);

authRouter.get('/password-reset', checkPasswordResetTokenValidity);

authRouter.post('/password-reset', checkSchema(requestNewPasswordSchema), sanitizerResult, requestPasswordResetToken);

authRouter.patch('/password-reset', checkSchema(recoverPasswordSchema), sanitizerResult, updateRecoveredUserPassword);

authRouter.use(checkAuthentication());

authRouter.post('/logout', logoutUser);

authRouter.patch('/update-user-password', checkSchema(updatePasswordSchema), sanitizerResult, updateUserPassword);

authRouter.get('/session', checkSession);

authRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
