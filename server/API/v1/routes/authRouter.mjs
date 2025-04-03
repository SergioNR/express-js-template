import { Router } from 'express';
import { checkSchema } from 'express-validator';
import { posthogUserLoggedOut, posthogUserSuccessLoggedIn } from '../../../models/posthogModel.mjs';
import { createUser, updateRecoveredUserPassword, updateUserPassword } from '../../../controllers/userController.mjs';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.mjs';
import { createUserValidationSchema } from '../../../utils/validators/createUserSchema.mjs';
import { updatePasswordSchema } from '../../../utils/validators/updatePasswordSchema.mjs';
import passport from '../../../auth/passportjs.mjs';
import { logError } from '../../../config/loggerFunctions.mjs';
import { checkSession, forgotPasswordRequest } from '../../../controllers/authController.mjs';

export const authRouter = Router();

authRouter.post('/login/local', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'An error occurred during login',
      });
    }

    if (!user) { //* Will trigger if user does not exist
      return res.status(401).json({
        success: false,
        message: 'The combination of email and password is incorrect',
      });
    }

    // Log the user in and establish a session
    req.login(user, (loginErr) => {
      if (loginErr) { //* Will trigger if password is incorrect
        return res.status(401).json({
          success: false,
          message: 'The combination of email and password is incorrect',
        });
      }

      posthogUserSuccessLoggedIn(user.id, 'local');
      // Successful login
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          role: req.user.role,
        },
      });
    });
  })(req, res, next);
});

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
