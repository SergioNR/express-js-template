import { STATUS_CODES } from 'node:http';
import { logError, logWarn } from '../config/loggerFunctions.js';

//* body-parser and http-errors set `status` / `statusCode` (e.g. 400 for
//* malformed JSON, 413 for oversized bodies) - keep those instead of a 500
const resolveStatusCode = (err) => {
  const candidate = err?.status ?? err?.statusCode;

  return Number.isInteger(candidate) && candidate >= 400 && candidate < 600 ? candidate : 500;
};

export const globalErrorHandler = (err, req, res, next) => {
  //* Once the response has started streaming Express must close the socket
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = resolveStatusCode(err);
  const isClientError = statusCode < 500;
  const isLocalhost = process.env.DEPLOY_ENVIRONMENT === 'localhost';

  //* Client errors are expected noise - log them as warnings and do not page
  //* the Telegram errors channel. req.path (not originalUrl) keeps query-string
  //* secrets such as password reset tokens out of the logs
  if (isClientError) {
    logWarn(`Client error ${statusCode} on ${req.method} ${req.path}`, err);
  } else {
    logError(err?.name || 'Unhandled error', err);
  }

  if (isLocalhost) {
    return res.status(statusCode).json({
      name: err?.name || STATUS_CODES[statusCode],
      message: err?.message || '',
    });
  }

  return res.status(statusCode).json({
    name: STATUS_CODES[statusCode] || 'Internal Server Error',
    message: isClientError ? 'The request could not be processed' : 'An error occurred, please try again later',
  });
};
