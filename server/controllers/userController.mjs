import bcrypt from 'bcryptjs';
import { User } from '../utils/classes/User.mjs';
import {
  createUserInDB,
  getUserByEmail,
  getUserById,
  deleteUserInDb,
  updateUserPasswordInDB,
} from '../models/userModel.mjs';
import { deletePasswordResetTokens, getPasswordResetTokenData } from '../models/passwordResetTokensModel.mjs';
import { logError } from '../config/loggerFunctions.mjs';

export const getProfile = async (req, res) => {
  req.user.password = undefined;

  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const deleteUser = async (req, res) => {
  try {
    await deleteUserInDb(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
    });
  }
};

export const updateUserPassword = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: req.sanitizedErrors,
    });
  }
  const {
    currentPassword,
    newPassword,
  } = req.body;

  try {
    const userId = req.user.id;
    const user = await getUserById(userId);

    if (user === null) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    const storedPasswordHash = user.password;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Compare current password with stored hash
    const isMatch = await bcrypt.compare(currentPassword, storedPasswordHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        ERR_CODE: 'INCORRECT_PASSWORD',
        message: 'Current password is incorrect',
      });
    }

    // Update password in database
    const updatedUser = await updateUserPasswordInDB(userId, hashedPassword);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      result: updatedUser,
    });
  } catch (error) {
    logError('Error updating user password', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating password',
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await deleteUserInDb(userId);

    return res.status(200).json({
      success: true,
      message: 'user successfully deleted',
      userId: deletedUser.user.id,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: 'Error deleting user',
    });
  }
};

export const createUser = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(422).json({
      success: false,
      message: 'User could not be created due to validation errors',
      errors: req.sanitizedErrors,
    });
  }

  try {
    const userData = {
      username: req.body.username,
      password: await bcrypt.hash(req.body.password, 10),
    };

    const existingUser = await getUserByEmail(userData.username);

    if (existingUser !== null) {
      return res.status(409).json({
        success: false,
        ERR_CODE: 'USER_ALREADY_EXISTS',
        message: 'A user with that email address already exists',
      });
    }

    const createdUser = await createUserInDB(new User(userData));

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: createdUser.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes',
    });
  }
};

export const updateRecoveredUserPassword = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: req.sanitizedErrors,
    });
  }

  try {
    const {
      newPassword,
      confirmNewPassword,
      token,
    } = req.body;

    const passwordResetTokenData = await getPasswordResetTokenData(token);

    if (!passwordResetTokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
      });
    }

    const {
      userId,
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
      message: 'Password updated successfully',
    });
  } catch (error) {
    logError('Error updating user password', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred, please try again later',
    });
  }
};
