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
  createAdminInDB,
} from '../models/userModel.js';
import { createPasswordResetToken, getPasswordResetTokenData, deletePasswordResetTokens } from '../models/passwordResetTokensModel.js';
import { sendResetPasswordTokenToUser } from '../integrations/brevo/transactionalEmails/sendResetPasswordTokenToUser.js';
import { createFreeTrialSubscription } from '../models/subscriptionModel.js';
import { createCompanyBillingId } from './billingController.js';

export const requestPasswordResetToken = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(422).json({
      success: false,
      message: 'New password could not be requested due to validation errors',
      errors: req.sanitizedErrors,
    });
  }

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
      error: error,
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
      message: 'Successfully retrieved password reset token',
      tokenData: passwordResetTokenData,
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
  if (req.sanitizedErrors) {
    return res.status(422).json({
      success: false,
      message: req.sanitizedErrors,
    });
  }

  try {
    const {
      newPassword,
      confirmNewPassword,
      passwordResetToken,
    } = req.body;

    const passwordResetTokenData = await getPasswordResetTokenData(passwordResetToken);

    const {
      user_id: userId,
      tokenExpires,
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

export const loginLocal = async (req, res, next) => {
  if (req.sanitizedErrors) {
    return res.status(422).json({
      message: 'Login could not be completed due to validation errors',
      errors: req.sanitizedErrors,
    });
  }

  return passport.authenticate('local', (err, user /* , info */) => {
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
          role: req.user.role,
        },
      });
    });
  })(req, res, next);
};

export const createUserInDb = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(422).json({
      success: false,
      message: 'User could not be created due to validation errors',
      errors: req.sanitizedErrors,
    });
  }

  const userData = {
    username: req.body.username,
    password: await bcrypt.hash(req.body.password, 10),
    role: req.body.role,
  };

  const isExistingUser = await getUserByEmail(userData.username);

  if (isExistingUser !== null) {
    return res.status(409).json({
      success: false,
      message: 'User creation failed - User already exists',
    });
  }

  const createdUser = await createUserInDB(userData);

  try { // ? Unsure if this error should interrupt registration flow - I think its not a good idea since we rather have the user register and then fix the issue manually that the other way around
    await createFreeTrialSubscription(createdUser.company_id);
  } catch (error) {
    logError('Error creating free trial subscription', error);
  }

  try {
    await createCompanyBillingId(createdUser);
  } catch (error) {
    logError('Error creating stripe billing Id', error);
  }

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    userId: createdUser.id,
  });
};

export const createAdminInDb = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(422).json({
      success: false,
      message: 'User could not be created due to validation errors',
      errors: req.sanitizedErrors,
    });
  }

  const userData = {
    username: req.body.username,
    password: await bcrypt.hash(req.body.password, 10),
    role: req.body.role,
  };

  const isExistingUser = await getUserByEmail(userData.username);

  if (isExistingUser !== null) {
    return res.status(409).json({
      success: false,
      message: 'User creation failed - User already exists',
    });
  }

  const createdUser = await createAdminInDB(userData);
  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    userId: createdUser.id,
  });
};

export const updateUserPassword = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(422).json({
      success: false,
      message: req.sanitizedErrors,
    });
  }

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

export const logoutUser = (req, res, next) => {
  if (!req.user) {
    return res.status(400).json({
      success: false,
      message: 'User is not logged in',
    });
  }

  return req.logout((err) => {
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
};
