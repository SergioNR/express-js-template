import { logError } from '../config/loggerFunctions.mjs';
import passport from '../auth/passportjs.mjs';
import { posthogUserSuccessLoggedIn } from '../models/posthogModel.mjs';

import { getUserByEmail } from '../models/userModel.mjs';
import { createPasswordResetToken } from '../models/passwordResetTokensModel.mjs';
import { sendResetPasswordTokenToUser } from '../integrations/brevo/transactionalEmails/sendResetPasswordTokenToUser.mjs';

export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);

    if (user) {
      const tokenCreation = await createPasswordResetToken(user.id);

      await sendResetPasswordTokenToUser(email, tokenCreation.id);
    }

    return res.status(200).json({
      success: true,
      message: 'If this email exists, a reset link will be sent',
    });
  } catch (error) {
    logError('Error in forgotPasswordRequest function', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred, please try again later',
      error: error,
    });
  }
};

export const checkSession = async (req, res) => {
  if (req.user) {
    return res.status(200).json({
      success: true,
      message: 'Session is valid',
      user: {
        id: req.user.id,
        role: req.user.role,
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Session is invalid',
  });
};

export const loginLocal = async (req, res, next) => {
  passport.authenticate('local', (err, user /* , info */) => {
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
    return req.login(user, (loginErr) => {
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
};
