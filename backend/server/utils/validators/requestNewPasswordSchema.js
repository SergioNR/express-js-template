export const requestNewPasswordSchema = {
  email: {
    notEmpty: {
      errorMessage: 'Username is required',
    },
    isEmail: {
      errorMessage: 'Please enter a valid email address',
      bail: true,
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
};
