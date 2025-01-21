import bcrypt from 'bcryptjs';
import { User } from '../utils/classes/User.mjs';
import {
  createUserInDB,
  getUserByEmail,
  getUserByUserId,
  updateUserPasswordInDB,
} from '../models/userModel.mjs';

export const createUser = async (req) => {
  const userData = {
    username: req.body.username,
    password: await bcrypt.hash(req.body.password, 10),
  };

  const existingUser = await getUserByEmail(userData.username);

  if (existingUser && existingUser.success === false) {
    return {
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes', //* Error generated on getUserByEmail() error
    };
  }

  if (existingUser !== null) {
    return {
      success: false,
      ERR_CODE: 'USER_ALREADY_EXISTS',
      message: 'A user with that email address already exists',
    };
  }

  const createdUser = await createUserInDB(new User(userData));

  if (createdUser.success === false) {
    return {
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes', //* Error generated on createUserInDB() error
    };
  }

  return {
    success: true,
    message: 'User created successfully',
  };
};

export const updateUserPassword = async (req) => {
  const {
    userId,
    currentPassword,
    newPassword,
  } = req.body;

  const user = await getUserByUserId(userId);

  if (!user || user.success === false) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  try {
    const storedPasswordHash = user.userDetails?.password;

    // Compare current password with stored hash
    const isMatch = await bcrypt.compare(currentPassword, storedPasswordHash);

    if (!isMatch) {
      return {
        success: false,
        ERR_CODE: 'INCORRECT_PASSWORD',
        message: 'Current password is incorrect',
      };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const updatedUser = await updateUserPasswordInDB(userId, hashedPassword);

    if (updatedUser.success === false) {
      return {
        success: false,
        message: 'Error updating password',
      };
    }

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error updating password',
    };
  }
};
