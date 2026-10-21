import { SECURE_TOKEN_PATTERN } from '../secureToken.js';

export const passwordResetTokenQuerySchema = {
  passwordResetToken: {
    in: ['query'],
    notEmpty: {
      errorMessage: 'Token is required',
    },
    matches: {
      options: SECURE_TOKEN_PATTERN,
      errorMessage: 'Password reset token is malformed',
    },
  },
};
