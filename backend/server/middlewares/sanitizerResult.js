import { validationResult } from 'express-validator';

const sensitiveFields = [
  'password',
  'confirmPassword',
  'confirmNewPassword',
  'token',
  'passwordResetToken',
  'email',
  'username',
  'newPassword',
  'currentPassword',
];

const sanitizeValidationError = (error) => {
  // Create a copy of the error object
  const sanitizedError = { ...error };

  // Hide value if it's a sensitive field
  if (sensitiveFields.includes(error.path)) {
    sanitizedError.value = '[REDACTED]';
  }

  return sanitizedError;
};

export const sanitizerResult = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const sanitizedErrors = result.errors.map(sanitizeValidationError);

    //* Requests with validation errors are rejected here so no controller
    //* can accidentally continue processing invalid input
    return res.status(422).json({
      success: false,
      message: 'Request could not be completed due to validation errors',
      errors: sanitizedErrors,
    });
  }

  return next();
};
