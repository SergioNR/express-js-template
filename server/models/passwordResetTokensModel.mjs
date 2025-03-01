import { PrismaClient } from '@prisma/client';
import { logError } from '../config/loggerFunctions.mjs';

const prisma = new PrismaClient();

export const createPasswordResetToken = async (userId) => {
  try {
    const queryResult = await prisma.password_reset_tokens.create({
      data: {
        user_id: userId,
        token: crypto.randomUUID(),
        token_expires: new Date(Date.now() + 3600000),
      },
    });

    return queryResult;
  } catch (error) {
    logError('Error creating password reset token', error);

    return {
      success: false,
    };
  }
};
