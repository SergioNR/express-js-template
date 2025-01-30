export const userIdInputValidator = {
  userId: {
    in: ['params'],
    isLength: {
      options: {
        min: 24,
        max: 24,
      },
      errorMessage: 'userId must be exactly 24 characters long',
    },
    trim: true,
  },
};
