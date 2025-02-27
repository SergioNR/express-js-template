import { Router } from 'express';
import { checkSchema } from 'express-validator';
import { createUser, updateUserPassword } from '../../../controllers/userController.mjs';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.mjs';
import { createUserValidationSchema } from '../../../utils/validators/createUserSchema.mjs';
import { updatePasswordSchema } from '../../../utils/validators/updatePasswordSchema.mjs';
import passport from '../../../auth/passportjs.mjs';
import { logError } from '../../../config/loggerFunctions.mjs';

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

      // Successful login
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
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

authRouter.post('/register/', checkSchema(createUserValidationSchema), sanitizerResult, createUser);

authRouter.patch('/updateUserPassword', checkSchema(updatePasswordSchema), sanitizerResult, updateUserPassword);

//   const passwordUpdate = await updateUserPassword(req);

//   if (passwordUpdate.success === false && passwordUpdate.ERR_CODE === 'INCORRECT_PASSWORD') {
//     return res.status(401).json({
//       success: false,
//       message: passwordUpdate.message,
//     });
//   }

//   if (passwordUpdate.success === false) {
//     return res.status(400).json({
//       success: false,
//       message: passwordUpdate.message,
//     });
//   }

//   return res.status(200).json({
//     success: true,
//     message: 'Password updated',
//   });
// });

// authRouter.post('/forgot-password', async (req, res) => {
//   //

//   res.status(200).json({
//     success: true,
//     message: 'This route is a WIP',
//   });
// });

// authRouter.post('/reset-password', async (req, res) => {
//   //

//   res.status(200).json({
//     success: true,
//     message: 'This route is a WIP',
//   });
// });

authRouter.get('/*fallback', (req, res) => {
  res.status(404).send('requested API Route does not exist in the userRouter');
});
