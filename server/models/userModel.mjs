import { PrismaClient } from '@prisma/client';
import { posthogUserUpdatedPassword, posthogUserDeleteAccount, posthogUserSignedUp } from './posthogModel.mjs';
import {
  logUserCreatedInDB,
  logError,
  logPasswordUpdated,
} from '../config/loggerFunctions.mjs';

const prisma = new PrismaClient();

export const createUserInDB = async (user) => {
  try {
    const createUserInDbQuery = await prisma.user.create({
      data: {
        email: user.userDetails.email,
        password: user.userDetails.password,
      },
    });

    logUserCreatedInDB(createUserInDbQuery.id, user);

    posthogUserSignedUp(createUserInDbQuery);

    return createUserInDbQuery;
  } catch (error) {
    logError('Error creating user in DB', error);

    throw error;
  }
};

export const getUserByEmail = async (userEmail) => {
  try {
    const getUserByEmailQuery = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    return getUserByEmailQuery;
  } catch (error) {
    logError('Error getting user by email', error);

    throw error;
  }
};

export const updateUserLastLoginDate = async (userId) => {
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

    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const getUserByIdQuery = await prisma.user.findUnique({
      where: { id: userId },
    });

    return getUserByIdQuery;
  } catch (error) {
    logError('Error getting user by user ID', error);
    throw error;
  }
};

export const updateUserPasswordInDB = async (userId, newPassword) => {
  try {
    const updatePasswordQuery = await prisma.user.update({

      where: { id: userId },
      data: {
        password: newPassword,
      },
    });

    logPasswordUpdated(userId);

    posthogUserUpdatedPassword(userId);

    return updatePasswordQuery;
  } catch (error) {
    logError('Error updating user password', error, { userId: userId });

    throw error;
  }
};

export const getAllCustomersInDb = async () => {
  try {
    const getAllCustomersQuery = await prisma.user.findMany({
      where: { role: 'customer' },
      omit: {
        password: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return getAllCustomersQuery;
  } catch (error) {
    logError('Error getting user by user ID', error);
    throw error;
  }
};

export const deleteUserInDb = async (userId) => {
  try {
    const deleteUserQuery = await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    posthogUserDeleteAccount(userId);

    return deleteUserQuery;
  } catch (error) {
    logError('Error deleting user', error);
    throw error;
  }
};
