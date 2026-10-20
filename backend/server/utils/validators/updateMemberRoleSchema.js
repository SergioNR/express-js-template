export const updateMemberRoleSchema = {
  roleName: {
    in: ['body'],
    notEmpty: {
      errorMessage: 'Role name is required',
    },
    isString: {
      errorMessage: 'Role name must be a string',
    },
    escape: true,
  },
};
