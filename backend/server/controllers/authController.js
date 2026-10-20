import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS, SESSION_COOKIE_NAME } from '../config/security.js';
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
import { deleteUserSessions, linkSessionToUser } from '../models/sessionModel.js';
import { sendResetPasswordTokenToUser } from '../integrations/brevo/transactionalEmails/sendResetPasswordTokenToUser.js';
import { sendExistingAccountNoticeToUser } from '../integrations/brevo/transactionalEmails/sendExistingAccountNoticeToUser.js';

export const requestPasswordResetToken = async (req, res) => {
  const { email } = req.body;

  const user = await getUserByEmail(email);

  if (user) {
    const tokenCreation = await createPasswordResetToken(user.id);

    //* Fire-and-forget - the function swallows its own errors so an email
    //* provider outage never changes this response
    sendResetPasswordTokenToUser(email, tokenCreation.id);
  }

  //* Not checking / notifying for user existence to prevent security leaks

  return res.status(200).json({
    success: true,
    message: 'If this email exists, a reset link will be sent',
  });
};

export const checkPasswordResetTokenValidity = async (req, res) => {
  const { passwordResetToken } = req.query;

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
    return res.status(400).json({
      success: false,
      message: 'Token expired - Please request a new password reset link',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Password reset token is valid',
  });
};

export const updateRecoveredUserPassword = async (req, res) => {
  const {
    newPassword,
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

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await updateUserPasswordInDB(userId, hashedPassword);

  await deletePasswordResetTokens(userId);

  //* Revoke every active session of the user - the old credential is no longer valid
  await deleteUserSessions(userId);

  return res.status(200).json({
    success: true,
    message: 'User password updated successfully using password reset token',
  });
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
  return req.login(user, async (loginErr) => {
    if (loginErr) { //* A session-establishment failure is a server error, not a credentials error
      logError('User login failed', loginErr);
      return next(loginErr);
    }

    // Successful login
    posthogUserSuccessLoggedIn(user.id, 'local'); // Fire-and-forget function

    updateUserLastLoginDate(user.id); // Fire-and-forget function

    //* Store the user id on the session row so sessions can be revoked by user
    await linkSessionToUser(req.sessionID, user.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        role: user.role,
      },
    });
  });
})(req, res, next);

export const registerUser = async (req, res) => {
  const userData = {
    username: req.body.username,
    password: await bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS),
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

  try {
    await createUserInDB(userData);
  } catch (error) {
    //* Concurrent registrations can beat the existence check - the unique
    //* constraint resolves the race, respond with the same enumeration-safe 201
    if (error.code === 'P2002') {
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
      });
    }

    throw error;
  }

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
  });
};

export const updateUserPassword = async (req, res) => {
  const {
    currentPassword,
    newPassword,
  } = req.body;

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

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password must be different from the current password',
    });
  }

  // Hash the new password
  const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Update password in database
  const updatedUser = await updateUserPasswordInDB(userId, newHashedPassword);

  //* Revoke every other session of the user - the current one is kept alive
  await deleteUserSessions(userId, req.sessionID);

  return res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    userId: updatedUser.id,
  });
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

    // Clear cookie on client side
    res.clearCookie(SESSION_COOKIE_NAME);

    return res.status(200).json({
      success: true,
      message: 'User logged out successfully',
    });
  });
});
