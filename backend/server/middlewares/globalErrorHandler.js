import { logError } from '../config/loggerFunctions.js';

export const globalErrorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  logError(err.name, err);
  res.status(err.status || 500).json({
    success: false,
    name: err.name || 'Internal Server Error',
    message: err.message || '',
  });
};
