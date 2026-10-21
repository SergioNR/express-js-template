export const adminUserListQueryValidationSchema = {
  role: {
    optional: true,
    isIn: {
      options: [['user', 'superadmin']],
      errorMessage: 'Role filter must be one of: user, superadmin',
    },
  },
  search: {
    optional: true,
    isString: {
      errorMessage: 'Search term must be a string',
    },
    trim: true,
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: 'Search term must not exceed 100 characters',
    },
  },
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
