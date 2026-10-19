export const recoverPasswordSchema = {
  newPassword: {
    notEmpty: {
      errorMessage: 'Password is required',
    },
    isString: {
      errorMessage: 'Password must be a string',
    },
    isLength: {
      options: {
        min: 6,
        max: 32,
      },
      errorMessage: 'Password must be between 6-32 characters long',
    },
  },
  confirmNewPassword: {
    notEmpty: {
      errorMessage: 'Password confirmation is required',
    },
    isString: {
      errorMessage: 'Password confirmation must be a string',
    },
    isLength: {
      options: {
        min: 6,
        max: 32,
      },
      errorMessage: 'Password must be between 6-32 characters long',
    },
  },
  passwordResetToken: {
    notEmpty: {
      errorMessage: 'Password reset token is required',
    },
    isString: {
      errorMessage: 'Password reset token must be a string',
    },
    isUUID: true,
  },
};
