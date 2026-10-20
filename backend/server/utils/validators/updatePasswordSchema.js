export const updatePasswordSchema = {
  currentPassword: {
    notEmpty: {
      errorMessage: 'Current password is required',
    },
    isString: {
      errorMessage: 'Current password must be a string',
    },
  },
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
  },
};
