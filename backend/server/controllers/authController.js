import bcrypt from 'bcryptjs';
import { logError } from '../config/loggerFunctions.js';
import passport from '../auth/passportjs.js';
import { posthogUserSuccessLoggedIn } from '../models/posthogModel.js';
import {
  getUserByEmail,
  updateUserPasswordInDB,
  createUserInDB,
  getUserPassword,
  updateUserLastLoginDate,
} from '../models/userModel.js';
import { createPasswordResetToken, getPasswordResetTokenData, deletePasswordResetTokens } from '../models/passwordResetTokensModel.js';
import { deleteUserSessions } from '../models/sessionModel.js';
import { sendResetPasswordTokenToUser } from '../integrations/brevo/transactionalEmails/sendResetPasswordTokenToUser.js';
import { sendExistingAccountNoticeToUser } from '../integrations/brevo/transactionalEmails/sendExistingAccountNoticeToUser.js';

export const requestPasswordResetToken = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);

    if (user) {
      const tokenCreation = await createPasswordResetToken(user.id);

      await sendResetPasswordTokenToUser(email, tokenCreation.id);
    }

    //* Not checking / notifying for user existence to prevent security leaks

    return res.status(200).json({
      success: true,
      message: 'If this email exists, a reset link will be sent',
    });
  } catch (error) {
    logError('Error in forgotPasswordRequest function', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred, please try again later',
    });
  }
};

export const checkPasswordResetTokenValidity = async (req, res) => {
  try {
    const { passwordResetToken } = req.query;

    if (!passwordResetToken) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      });
    }

    const passwordResetTokenData = await getPasswordResetTokenData(passwordResetToken);

    if (!passwordResetTokenData) {
      return res.status(404).json({
        success: false,
        message: 'Password reset token does not exist',
      });
    }

    const {
      token_expires: tokenExpirationDate,
    } = passwordResetTokenData;

    if (new Date(tokenExpirationDate) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Token expired - Please request a new password reset link',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset token is valid',
    });
  } catch (error) {
    logError('Failed retrieving password reset token', error);
    return res.status(500).json({
      success: false,
      message: 'Token expiration date retrieval failed',
    });
  }
};

export const updateRecoveredUserPassword = async (req, res) => {
  try {
    const {
      newPassword,
      confirmNewPassword,
      passwordResetToken,
    } = req.body;

    const passwordResetTokenData = await getPasswordResetTokenData(passwordResetToken);

    if (!passwordResetTokenData) {
      return res.status(404).json({
        success: false,
        message: 'Password reset token does not exist',
      });
    }

    const {
      user_id: userId,
      token_expires: tokenExpires,
    } = passwordResetTokenData;

    if (new Date(tokenExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Token expired - Please request a new password reset link',
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await updateUserPasswordInDB(userId, hashedPassword);

    await deletePasswordResetTokens(userId);

    //* Revoke every active session of the user - the old credential is no longer valid
    await deleteUserSessions(userId);

    return res.status(200).json({
      success: true,
      message: 'User password updated successfully using password reset token',
    });
  } catch (error) {
    logError('Error updating user password', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred, please try again later',
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
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Session is invalid',
  });
};

export const loginLocal = (req, res, next) => passport.authenticate('local', (err, user /* , info */) => {
  if (err) {
    return next(err);
  }

  if (!user) { //* Will trigger if user does not exist
    return res.status(401).json({
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

    // Successful login
    posthogUserSuccessLoggedIn(user.id, 'local'); // Fire-and-forget function

    updateUserLastLoginDate(user.id); // Fire-and-forget function

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        role: user.role,
      },
    });
  });
})(req, res, next);

export const createUserInDb = async (req, res) => {
  try {
    const userData = {
      username: req.body.username,
      password: await bcrypt.hash(req.body.password, 10),
    };

    const isExistingUser = await getUserByEmail(userData.username);

    if (isExistingUser !== null) {
      //* Fire-and-forget so email delivery cannot change the response
      //* shape or timing of the duplicate-registration path
      sendExistingAccountNoticeToUser(userData.username);

      //* Responding with the same shape & status as a successful creation
      //* so the endpoint cannot be used to enumerate registered emails
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
      });
    }

    await createUserInDB(userData);

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
    });
  } catch (error) {
    logError('User creation failed', error);
    return res.status(500).json({
      success: false,
      message: 'User creation failed - Please try again later',
    });
  }
};

export const updateUserPassword = async (req, res) => {
  const {
    currentPassword,
    newPassword,
  } = req.body;

  try {
    const { id: userId } = req.user;

    const currentHashedPasswordQuery = await getUserPassword(userId);

    if (!currentHashedPasswordQuery) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { password: currentHashedPassword } = currentHashedPasswordQuery;

    // Compare current password with stored hash
    const isMatch = await bcrypt.compare(currentPassword, currentHashedPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash the new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const updatedUser = await updateUserPasswordInDB(userId, newHashedPassword);

    //* Revoke every other session of the user - the current one is kept alive
    await deleteUserSessions(userId, req.sessionID);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      userId: updatedUser.id,
    });
  } catch (error) {
    logError('Password update failed', error);
    return res.status(500).json({
      success: false,
      message: 'Password update failed',
    });
  }
};

export const logoutUser = (req, res, next) => req.logout((err) => {
  if (err) {
    logError('User logout failed', err);
    return next(err);
  }

  // Destroy session explicitly
  return req.session.destroy((error) => {
    if (error) {
      logError('Session destruction failed', error);
      return next(error);
    }

    // Clear cookie on client side - adjust cookie name as needed
    res.clearCookie('connect.sid');

    return res.status(200).json({
      success: true,
      message: 'User logged out successfully',
    });
  });
});
