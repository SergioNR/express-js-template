import { PrismaClient } from '@prisma/client';
import { logError } from '../config/loggerFunctions.mjs';

const prisma = new PrismaClient();

export const createPasswordResetToken = async (userId) => {
  try {
    const queryResult = await prisma.password_reset_tokens.create({
      data: {
        user_id: userId,
        token_expires: new Date(Date.now() + 3600000),
      },
    });

    return {
      success: true,
      tokenId: queryResult.id,
    };
  } catch (error) {
    logError('Error creating password reset token', error);

    return {
      success: false,
    };
  }
};

export const getTokenDataByToken = async (token) => {
  try {
    const tokenData = await prisma.password_reset_tokens.findFirst({
      where: {
        id: token,
      },
    });

    if (!tokenData) {
      return {
        success: false,
        message: 'Token not found',
      };
    }

    return {
      success: true,
      userId: tokenData.user_id,
      tokenExpires: tokenData.token_expires,
    };
  } catch (error) {
    logError('Error getting token data by token', error);

    return {
      success: false,
    };
  }
};

export const deletePasswordResetTokens = async (userId) => {
  try {
    const deleteResult = await prisma.password_reset_tokens.deleteMany({
      where: {
        user_id: userId,
      },
    });

    return {
      success: true,
      deletedCount: deleteResult.count,
    };
  } catch (error) {
    logError('Error deleting token', error);

    return {
      success: false,
    };
  }
};
