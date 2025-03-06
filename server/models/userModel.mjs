import { PrismaClient } from '@prisma/client';
import {
  logUserCreatedInDB,
  logError,
  logPasswordUpdated,
} from '../config/loggerFunctions.mjs';
import { posthogUserSignedUp } from './posthogModel.mjs';

const prisma = new PrismaClient();

export const createUserInDB = async (user) => {
  try {
    const insertQuery = await prisma.user.create({
      data: {
        email: user.userDetails.email,
        password: user.userDetails.password,
      },
    });

    logUserCreatedInDB(insertQuery.id, user);

    posthogUserSignedUp(user);

    return insertQuery;
  } catch (error) {
    logError('Error creating user in DB', error);

    return {
      success: false,
    };
  }
};

export const getUserByEmail = async (userEmail) => {
  try {
    const queryResult = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    return queryResult;
  } catch (error) {
    logError('Error getting user by email', error);

    return {
      success: false,
    };
  }
};

export const updateLastLoginDate = async (userId) => {
  try {
    const queryResult = await prisma.user.update({
      where: { id: userId },
      data: {
        last_login_at: new Date(),
      },
    });

    return queryResult;
  } catch (error) {
    logError('Error updating last login date', error);

    return {
      success: false,
    };
  }
};

export const getUserById = async (userId) => {
  try {
    const queryResult = await prisma.user.findUnique({
      where: { id: userId },
    });

    return queryResult;
  } catch (error) {
    logError('Error getting user by user ID', error);

    return {
      success: false,
      message: 'Database operation failed',
    };
  }
};

export const updateUserPasswordInDB = async (userId, newPassword) => {
  try {
    const queryResult = await prisma.user.update({

      where: { id: userId },
      data: {
        password: newPassword,
      },
    });

    logPasswordUpdated(userId);

    return {
      success: true,
      userId: userId,
      query: queryResult,
    };
  } catch (error) {
    logError('Error updating user password', error, { userId: userId });

    return {
      success: false,
    };
  }
};

export const findUsersInDb = async () => {
  try {
    const queryResult = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        last_updated_at: true,
        last_login_at: true,
      },
    });

    return queryResult;
  } catch (error) {
    logError('Error getting user by user ID', error);

    throw error; // will be handled in userService
  }
};

export const deleteUserInDb = async (userId) => {
  try {
    const queryResult = await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    if (queryResult !== null) {
      return {
        success: true,
        message: 'User deleted',
        user: queryResult,
      };
    }

    throw Error('user was not deleted');
  } catch (error) {
    logError('error deleting User', error);

    return {
      success: false,
      message: 'failed to delete user',
    };
  }
};
