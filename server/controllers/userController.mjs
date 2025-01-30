import bcrypt from 'bcryptjs';
import { User } from '../utils/classes/User.mjs';
import {
  createUserInDB,
  deleteUserInDb,
  findUsersInDb,
  getUserByEmail,
  getUserById,
  updateUserPasswordInDB,
} from '../models/userModel.mjs';

export const getAllUsers = async (req, res) => {
  const usersInDb = await findUsersInDb();

  res.status(200).json({
    success: true,
    userCount: usersInDb.length,
    users: usersInDb,
  });
};

export const getOneUserById = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId',
      errors: req.sanitizedErrors,
    });
  }

  const { userId } = req.params;

  const user = await getUserById(userId);

  if (user && user.success === false) { // This means there has been an error
    return res.status(502).json({
      success: false,
      errorMessage: user.message,
    });
  }

  if (user === null) {
    return res.status(400).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    user: user,
  });
};

export const deleteOneUserById = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId',
      errors: req.sanitizedErrors,
    });
  }

  // TODO - Add authorization middleware

  const { userId } = req.params;

  const user = await getUserById(userId);

  if (user && user.success === false) { // This means there has been an error
    return res.status(502).json({
      success: false,
      errorMessage: user.message,
    });
  }

  if (user === null) {
    return res.json({
      success: false,
      message: 'user not found',
    });
  }

  const deletedUser = await deleteUserInDb(userId);

  if (deletedUser && deletedUser.success === false) {
    return res.status(502).json({
      success: false,
      message: deletedUser.message,
    });
  }

  return res.json({
    message: 'user successfully deleted',
  });
};

export const createUser = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId',
      errors: req.sanitizedErrors,
    });
  }
  const userData = {
    username: req.body.username,
    password: await bcrypt.hash(req.body.password, 10),
  };

  const existingUser = await getUserByEmail(userData.username);

  if (existingUser && existingUser.success === false) {
    return res.status(500).json({
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes', //* Error generated on getUserByEmail() error
    });
  }

  if (existingUser !== null) {
    return res.status(300).json({
      success: false,
      ERR_CODE: 'USER_ALREADY_EXISTS',
      message: 'A user with that email address already exists',
    });
  }

  const createdUser = await createUserInDB(new User(userData));

  if (createdUser.success === false) {
    return {
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes', //* Error generated on createUserInDB() error
    };
  }

  return res.status(200).json({
    success: true,
    message: 'User created successfully',
  });
};

export const updateUserPassword = async (req) => {
  const {
    userId,
    currentPassword,
    newPassword,
  } = req.body;

  const user = await getUserById(userId);

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
