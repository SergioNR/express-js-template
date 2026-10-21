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
import {
  createPasswordResetToken,
  getPasswordResetTokenData,
  resetUserPasswordWithTokenInDb,
} from '../models/passwordResetTokensModel.js';
import { getTeamInviteByTokenInDb, deleteTeamInviteByIdSafe } from '../models/teamInvitesModel.js';
import { deleteUserSessions, linkSessionToUser } from '../models/sessionModel.js';
import { sendResetPasswordTokenToUser } from '../integrations/brevo/transactionalEmails/sendResetPasswordTokenToUser.js';
import { sendExistingAccountNoticeToUser } from '../integrations/brevo/transactionalEmails/sendExistingAccountNoticeToUser.js';

//* Detached from the request: the lookup, token creation and email all run
//* after the response was sent, so neither the body nor the timing of the
//* response depends on whether the account exists. Swallows its own errors
const issuePasswordResetToken = async (email) => {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return;
    }

    const passwordResetToken = await createPasswordResetToken(user.id);

    //* The function swallows its own errors - recipient is the stored address
    await sendResetPasswordTokenToUser(user.email, passwordResetToken);
  } catch (error) {
    logError('Password reset token issuance failed', error);
  }
};

export const requestPasswordResetToken = async (req, res) => {
  const { email } = req.body;

  issuePasswordResetToken(email); // Fire-and-forget

  //* Not checking / notifying for user existence to prevent security leaks
  return res.status(200).json({
    message: 'If this email exists, a reset link will be sent',
  });
};

export const checkPasswordResetTokenValidity = async (req, res) => {
  const { passwordResetToken } = req.query;

  const passwordResetTokenData = await getPasswordResetTokenData(passwordResetToken);

  if (!passwordResetTokenData) {
    return res.status(404).json({});
  }

  const {
    token_expires: tokenExpirationDate,
  } = passwordResetTokenData;

  if (new Date(tokenExpirationDate) < new Date()) {
    return res.status(400).json({
      message: 'Password reset token expired',
    });
  }

  return res.status(200).json({});
};

export const updateRecoveredUserPassword = async (req, res) => {
  const {
    newPassword,
    passwordResetToken,
  } = req.body;

  //* Hashed before the transaction so the slow bcrypt never holds row locks
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  //* Consumes the token (single use), updates the password and revokes every
  //* reset token and session of the user in one transaction
  const resetResult = await resetUserPasswordWithTokenInDb(passwordResetToken, hashedPassword);

  if (!resetResult) {
    return res.status(400).json({
      message: 'Password reset token is invalid or expired',
    });
  }

  return res.status(200).json({});
};

export const checkTeamInviteValidity = async (req, res) => {
  const { inviteToken } = req.query;

  const inviteData = await getTeamInviteByTokenInDb(inviteToken);

  if (!inviteData) {
    return res.status(404).json({
      message: 'Team invite does not exist',
    });
  }

  const { token_expires: tokenExpirationDate } = inviteData;

  if (new Date(tokenExpirationDate) < new Date()) {
    return res.status(400).json({
      message: 'Invite expired - Please ask a team admin for a new invite',
    });
  }

  return res.status(200).json({
    email: inviteData.email,
    companyName: inviteData.Company?.name,
    roleName: inviteData.Role.name,
  });
};

export const acceptTeamInvite = async (req, res) => {
  const {
    inviteToken,
    password,
  } = req.body;

  const inviteData = await getTeamInviteByTokenInDb(inviteToken);

  if (!inviteData) {
    return res.status(404).json({
      message: 'Team invite does not exist',
    });
  }

  const { token_expires: tokenExpires } = inviteData;

  if (new Date(tokenExpires) < new Date()) {
    return res.status(400).json({
      message: 'Invite expired - Please ask a team admin for a new invite',
    });
  }

  const existingUser = await getUserByEmail(inviteData.email);

  if (existingUser) {
    //* The invitee registered on their own in the meantime - the invite is void
    await deleteTeamInviteByIdSafe(inviteData.id);

    return res.status(409).json({
      message: 'Email is already registered - Please log in instead',
    });
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    await createUserInDB({
      username: inviteData.email,
      password: hashedPassword,
      companyId: inviteData.company_id,
      roleId: inviteData.role_id,
      inviteId: inviteData.id, //* Consumed in the same transaction as the user creation
    });
  } catch (error) {
    //* Concurrent self-registration with the same email can beat the check
    //* above - the unique constraint resolves the race
    if (error.code === 'P2002') {
      await deleteTeamInviteByIdSafe(inviteData.id);

      return res.status(409).json({
        message: 'Email is already registered - Please log in instead',
      });
    }

    throw error;
  }

  //* No auto-login here - consistent with the register endpoint
  return res.status(201).json({});
};

export const checkSession = async (req, res) => {
  if (req.user) {
    return res.status(200).json({
      user: {
        id: req.user.id,
      },
    });
  }

  return res.status(401).json({});
};

export const loginLocal = (req, res, next) => passport.authenticate('local', (err, user) => {
  if (err) {
    return next(err);
  }

  if (!user) { //* Will trigger if user does not exist
    return res.status(401).json({});
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
      user: {
        id: user.id,
        role: user.role,
      },
    });
  });
})(req, res, next);

//* Detached from the request so the existing-account and new-account paths
//* are indistinguishable in response body, status AND timing (the bcrypt
//* hash and the multi-row create would otherwise only run for new emails).
//* Swallows its own errors - they are logged, never surfaced to the client
const registerUserInBackground = async (email, password) => {
  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      //* The function swallows its own errors - recipient is the stored address
      await sendExistingAccountNoticeToUser(existingUser.email);

      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    await createUserInDB({
      username: email,
      password: hashedPassword,
    });
  } catch (error) {
    //* Concurrent registrations can beat the existence check - the unique
    //* constraint resolves the race, nothing else to do
    if (error.code === 'P2002') {
      return;
    }

    logError('Background user registration failed', error);
  }
};

export const registerUser = async (req, res) => {
  const { username, password } = req.body;

  registerUserInBackground(username, password); // Fire-and-forget

  //* Same shape & status for new and already-registered emails so the
  //* endpoint cannot be used to enumerate registered emails
  return res.status(201).json({});
};

export const updateUserPassword = async (req, res) => {
  const {
    currentPassword,
    newPassword,
  } = req.body;

  const { id: userId } = req.user;

  const currentHashedPasswordQuery = await getUserPassword(userId);

  if (!currentHashedPasswordQuery) {
    return res.status(404).json({});
  }

  const { password: currentHashedPassword } = currentHashedPasswordQuery;

  // Compare current password with stored hash
  const isMatch = await bcrypt.compare(currentPassword, currentHashedPassword);

  if (!isMatch) {
    //* Both 400s carry a stable code - the SPA maps it to user-facing copy
    return res.status(400).json({
      message: 'Current password is incorrect',
      code: 'AUTH_CURRENT_PASSWORD_INCORRECT',
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      message: 'New password must be different from the current password',
      code: 'AUTH_PASSWORD_UNCHANGED',
    });
  }

  // Hash the new password
  const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Update password in database
  const updatedUser = await updateUserPasswordInDB(userId, newHashedPassword);

  //* Revoke every other session of the user - the current one is kept alive
  await deleteUserSessions(userId, req.sessionID);

  return res.status(200).json({
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

    return res.status(200).json({});
  });
});
