export const userLoginValidationSchema = {
  username: {
    isEmail: {
      errorMessage: 'Invalid email or password',
    },
    normalizeEmail: {
      options: {
        gmail_remove_dots: true,
        gmail_remove_subaddress: true,
        gmail_convert_googlemaildotcom: true,
        outlookdotcom_remove_subaddress: true,
        yahoo_remove_subaddress: true,
        icloud_remove_subaddress: true,
      },
    },
    escape: true,
  },
  password: {
    notEmpty: {
      errorMessage: 'Invalid email or password',
    },
    trim: true,
    escape: true,
  },
};
