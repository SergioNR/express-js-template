import { logError } from '../config/loggerFunctions.js';

export const globalErrorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  logError(err.name, err);

  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return res.status(statusCode).json({
    name: isDevelopment ? err.name || 'Internal Server Error' : 'Internal Server Error',
    message: isDevelopment ? err.message || '' : 'An error occurred, please try again later',
  });
};
