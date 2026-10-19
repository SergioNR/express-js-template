import { prisma } from '../config/prismaClient.js';
import { posthogUserDeleteAccount, posthogUserSignedUp } from './posthogModel.js';
import {
  logError,
  logInfo,
} from '../config/loggerFunctions.js';

export const createUserInDB = async (userData) => {
  const createUserInDbQuery = await prisma.user.create({
    data: {
      email: userData.username,
      password: userData.password,
      role: userData.role,
      Company: {
        create: {
        },
      },
    },
  });

  logInfo(`${userData.role} ${createUserInDbQuery.id} created in DB`, createUserInDbQuery);

  posthogUserSignedUp(createUserInDbQuery); // Fire-and-forget

  return createUserInDbQuery;
};

export const createAdminInDB = async (userData) => {
  const createUserInDbQuery = await prisma.user.create({
    data: {
      email: userData.username,
      password: userData.password,
      role: userData.role,
    },
  });

  logInfo(`${userData.role} ${createUserInDbQuery.id} created in DB`, createUserInDbQuery);

  return createUserInDbQuery;
};

export const getUserByEmail = async (userEmail) => {
  const whereClause = {
    email: userEmail,
  };

  const getUserByEmailQuery = await prisma.user.findUnique({
    where: whereClause,
  });

  return getUserByEmailQuery;
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
    return logError(`could not update last login date for userid ${userId}`, error);
  }
};

export const getUserPassword = async (userId) => {
  const whereClause = {
    id: userId,
  };

  const getUserPasswordQuery = await prisma.user.findUnique({
    where: whereClause,
    select: {
      password: true,
    },
  });

  return getUserPasswordQuery;
};

export const getUserById = async (userId) => {
  const whereClause = {
    id: userId,
  };

  const getUserByIdQuery = await prisma.user.findUnique({
    where: whereClause,
    omit: {
      password: true,
    },
  });

  return getUserByIdQuery;
};

export const updateUserPasswordInDB = async (userId, newPassword) => {
  const updatePasswordQuery = await prisma.user.update({
    where: { id: userId },
    data: {
      password: newPassword,
    },
  });

  logInfo(`Password updated successfully for User ${userId}`);

  return updatePasswordQuery;
};

export const getAllUsersInDb = async (filters = {}) => {
  const getAllUsersQuery = await prisma.user.findMany({
    where: filters,
    omit: {
      password: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return getAllUsersQuery;
};

export const deleteUserInDb = async (userId) => {
  const deleteUserQuery = await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  logInfo(`User ${userId} succesfully deleted`);

  posthogUserDeleteAccount(userId);

  return deleteUserQuery;
};
