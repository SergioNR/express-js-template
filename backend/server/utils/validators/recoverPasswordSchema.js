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
        min: 8,
        max: 64,
      },
      errorMessage: 'Password must be between 8-64 characters long',
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
      },
      errorMessage: 'Password must contain at least one lowercase letter, one uppercase letter and one number',
    },
    custom: {
      options: (value, { req }) => value === req.body.confirmNewPassword,
      errorMessage: 'Passwords do not match',
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
        min: 8,
        max: 64,
      },
      errorMessage: 'Password must be between 8-64 characters long',
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
