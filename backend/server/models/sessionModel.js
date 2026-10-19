import { prisma } from '../config/prismaClient.js';
import { logError } from '../config/loggerFunctions.js';

export const deleteUserSessions = async (userId, exceptSessionId = null) => {
  try {
    const whereClause = {
      data: {
        contains: userId,
      },
    };

    if (exceptSessionId) {
      whereClause.NOT = {
        sid: exceptSessionId,
      };
    }

    const deleteResult = await prisma.session.deleteMany({
      where: whereClause,
    });

    return {
      success: true,
      deletedCount: deleteResult.count,
    };
  } catch (error) {
    return logError(`Sessions for user ID ${userId} deletion failed`, error);
    // throw error //* NOT throwing an error since req-res
    //*  flow should not be interrupted with this cleanup operation
  }
};
