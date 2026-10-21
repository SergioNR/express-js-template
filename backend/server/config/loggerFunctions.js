import { logger } from './logger.js';
import { sendErrorLogsToTelegram } from '../integrations/telegram/sendLogsToTelegram.js';

//* Only a whitelist of error fields is logged - serializing the whole error
//* object leaks whatever libraries attach to it (request bodies, headers,
//* connection strings, Prisma query params, ...)
export const serializeError = (error) => {
  if (error === null || error === undefined) {
    return { name: 'UnknownError', message: 'no error provided' };
  }

  if (typeof error !== 'object') {
    return { name: 'NonErrorThrown', message: String(error) };
  }

  const serialized = {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status ?? error.statusCode,
    stack: error.stack,
  };

  return Object.fromEntries(Object.entries(serialized).filter(([, value]) => value !== undefined));
};

//* Severity decides the channel: errors page a human through Telegram, while
//* warnings and info stay in pino only - routine events must never flood the
//* alert chat, or real incidents drown in them
export const logError = (errorMessage, error, additionalInfo = 'N/A') => {
  try {
    logger.error({
      message: errorMessage,
      context: {
        errorDetails: serializeError(error),
        additionalInfo: additionalInfo,
      },
    });

    sendErrorLogsToTelegram(errorMessage, serializeError(error), additionalInfo);
  } catch {
    // Fail silently
  }
};

export const logWarn = async (message, error, additionalInfo = 'N/A') => {
  try {
    logger.warn({
      message: message,
      context: {
        errorDetails: serializeError(error),
        additionalInfo: additionalInfo,
      },
    });
  } catch {
    // Fail silently
  }
};

export const logInfo = async (message, context = 'no context') => {
  try {
    logger.info({
      message: message,
      context: context,
    });
  } catch {
    // Fail silently
  }
};

export const logPasswordResetTokenCreated = (userId) => {
  logger.info({
    message: 'User password reset token succesfully created in database',
    context: {
      userData: {
        userId: userId,
      },
    },
  });
};

export const logRateLimited = async (req) => {
  logger.warn({
    message: 'rate limit exceeded',
    context: {
      ipAddress: req.ip,
    },
  });
};
