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
        min: 6,
        max: 32,
      },
      errorMessage: 'Password must be between 6-32 characters long',
    },
  },
};
