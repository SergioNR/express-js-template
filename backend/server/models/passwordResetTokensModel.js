import { PrismaClient } from '../config/generated/prisma/client/index.js';
import { logError, logPasswordResetTokenCreated } from '../config/loggerFunctions.js';

const prisma = new PrismaClient();

export const createPasswordResetToken = async (userId) => {
  const createPasswordResetTokenQuery = await prisma.passwordResetTokens.create({
    data: {
      user_id: userId,
      token_expires: new Date(Date.now() + 3600000),
    },
  });

  logPasswordResetTokenCreated(userId);

  return createPasswordResetTokenQuery;
};

export const getPasswordResetTokenData = async (token) => {
  const whereClause = {
    id: token,
  };

  const getPasswordResetTokenDataQuery = await prisma.passwordResetTokens.findFirst({
    where: whereClause,
  });

  return getPasswordResetTokenDataQuery;
};

export const deletePasswordResetTokens = async (userId) => {
  try {
    const whereClause = {
      user_id: userId,
    };

    const deleteResult = await prisma.passwordResetTokens.deleteMany({
      where: whereClause,
    });

    return {
      success: true,
      deletedCount: deleteResult.count,
    };
  } catch (error) {
    return logError(`Token for user ID ${userId} deletion failed`, error);
    // throw error //* NOT throwing an error since req-res
    //*  flow should not be interrupted with this cleanup operation
  }
};

export const deleteExpiredPasswordResetTokens = async () => {
  const whereClause = {
    token_expires: {
      lt: new Date(),
    },
  };

  await prisma.passwordResetTokens.deleteMany({
    where: whereClause,
  });
};
