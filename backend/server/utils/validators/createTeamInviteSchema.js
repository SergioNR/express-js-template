export const createTeamInviteSchema = {
  email: {
    in: ['body'],
    notEmpty: {
      errorMessage: 'Email is required',
    },
    isEmail: {
      errorMessage: 'Please enter a valid email address',
      bail: true,
    },
    normalizeEmail: {
      options: {
        lowercase: true,
        gmail_remove_dots: true,
        gmail_remove_subaddress: true,
        gmail_convert_googlemaildotcom: true,
        outlookdotcom_remove_subaddress: true,
        yahoo_remove_subaddress: true,
        icloud_remove_subaddress: true,
      },
    },
    isLength: {
      options: {
        max: 254,
        min: 3,
      },
      errorMessage: 'Email must not exceed 254 characters',
    },
    escape: true,
  },
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
