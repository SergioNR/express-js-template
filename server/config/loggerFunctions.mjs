import { logger } from './logger.mjs';
import { sendErrorLogsToTelegram } from '../integrations/telegram/sendErrorLogsToTelegram.mjs';

export const logUserLoggedInSuccessfully = (userId, loginMethod) => {
  logger.info({
    message: 'User logged in successfully',
    context: {
      userId: userId,
      loginMethod: loginMethod,
      additionalInfo: 'n/a',
    },
  });
};

export const logUserCreatedInDB = (userId, user) => {
  logger.info({
    message: 'User succesfully created in database',
    context: {
      userData: {
        userId: userId,
        role: user.userDetails.role,
      },
    },
  });
};

export const logUserLoggedOut = (userId) => {
  logger.info({
    message: 'User logged out successfully',
    context: {
      userId: userId,
    },
  });
};

export const logFatalMongoDbConnectionError = (error) => {
  logger.fatal({
    message: `[DB CONNECTION] Can't connect to MongoDB - ${error.errmsg}`,
    context: {
      error: error.message,
    },
  });
};

export const logFatalMongoDBSessionInitError = (error) => {
  logger.fatal({
    message: 'MongoDB session store initialization failed',
    context: {
      name: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      errorDetails: error, // I will log the entire error object for now just in case}
    },
  });
};

export const logPasswordUpdated = (userId) => {
  logger.info({
    message: 'Password updated successfully',
    context: {
      userId: userId,
    },
  });
};

export const logError = (message, error, additionalInfo = 'N/A') => {
  logger.error({
    message: message,
    context: {
      name: error.name,
      errorMessage: error.message,
      // errorStack: error.stack,
      errorDetails: error, // I will log the entire error object for now just in case
      additionalInfo: additionalInfo,
    },
  });

  sendErrorLogsToTelegram(error);
};

export const logWarn = async (message, error, additionalInfo = 'N/A') => {
  logger.warn({
    message: message,
    context: {
      name: error.name || 'no error name',
      errorMessage: error.message || 'no error message',
      errorStack: error.stack || 'no error stack',
      errorDetails: error, // I will log the entire error object for now just in case
      additionalInfo: additionalInfo,
    },
  });
};
