import { Router } from 'express';
import { checkSchema } from 'express-validator';
import { createUser, updateRecoveredUserPassword, updateUserPassword } from '../../../controllers/userController.mjs';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.mjs';
import { createUserValidationSchema } from '../../../utils/validators/createUserSchema.mjs';
import { updatePasswordSchema } from '../../../utils/validators/updatePasswordSchema.mjs';
import { logError } from '../../../config/loggerFunctions.mjs';
import { checkSession, forgotPasswordRequest, loginLocal } from '../../../controllers/authController.mjs';

export const authRouter = Router();

authRouter.post('/login/local', loginLocal);

authRouter.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      logError('logoutError', err);
      return next(err);
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  });
});

authRouter.post('/register/local', checkSchema(createUserValidationSchema), sanitizerResult, createUser);

authRouter.patch('/updateUserPassword', checkSchema(updatePasswordSchema), sanitizerResult, updateUserPassword);

authRouter.post('/recoverPassword', forgotPasswordRequest);

authRouter.patch('/createNewPassword', checkSchema(updatePasswordSchema), sanitizerResult, updateRecoveredUserPassword);

authRouter.get('/check-session', checkSession);

authRouter.get('/*fallback', (req, res) => {
  res.status(404).send('requested API Route does not exist in the userRouter');
});
