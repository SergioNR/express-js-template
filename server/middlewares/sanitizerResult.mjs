import { validationResult } from 'express-validator';

const sanitizeValidationError = (error) => {
  // List of fields to hide
  const sensitiveFields = ['password',
    'confirmPassword',
    'token',
    'email',
    'username',
    'newPassword',
    'currentPassword',
  ];

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

    req.sanitizedErrors = sanitizedErrors;
  }
  next();
};
