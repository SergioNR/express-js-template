export const passwordResetTokenQuerySchema = {
  passwordResetToken: {
    in: ['query'],
    notEmpty: {
      errorMessage: 'Token is required',
    },
    isUUID: {
      errorMessage: 'Password reset token must be a valid UUID',
    },
  },
};
