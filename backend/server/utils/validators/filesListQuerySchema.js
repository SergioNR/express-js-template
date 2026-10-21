export const filesListQueryValidationSchema = {
  limit: {
    optional: true,
    isInt: {
      options: {
        min: 1,
        max: 100,
      },
      errorMessage: 'Limit must be an integer between 1 and 100',
    },
  },
  cursor: {
    optional: true,
    isUUID: {
      errorMessage: 'Cursor must be a valid UUID',
    },
  },
};
