import { prisma } from '../config/prismaClient.js';
import { logError } from '../config/loggerFunctions.js';

//* Called right after a successful req.login so the session row keeps a real
//* user_id column instead of relying on matching the serialized JSON blob
export const linkSessionToUser = async (sessionId, userId) => {
  try {
    await prisma.session.update({
      where: {
        sid: sessionId,
      },
      data: {
        user_id: userId,
      },
    });
  } catch (error) {
    logError(`Could not link session to user ${userId}`, error);
    // throw error //* NOT throwing an error since req-res
    //*  flow should not be interrupted by this bookkeeping operation
  }
};

export const countActiveSessionsInDb = async () => {
  const activeSessionCount = await prisma.session.count({
    where: {
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return activeSessionCount;
};

//* Session counts only - the serialized `data` blob is sensitive and never
//* exposed through the admin API
export const countActiveSessionsByUserInDb = async (userId) => {
  const activeSessionCount = await prisma.session.count({
    where: {
      user_id: userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return activeSessionCount;
};

export const deleteUserSessions = async (userId, exceptSessionId = null) => {
  try {
    const whereClause = {
      user_id: userId,
    };

    if (exceptSessionId) {
      whereClause.sid = {
        not: exceptSessionId,
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
