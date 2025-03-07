export const createUserValidationSchema = {
  username: {
    notEmpty: {
      errorMessage: 'Username is required',
    },
    isEmail: {
      errorMessage: 'Please enter a valid email address',
      bail: true,
    },
    custom: {
      options: (value) => {
        const blockedDomains = ['tempmail.com', 'throwaway.com'];
        const domain = value.split('@')[1];
        if (blockedDomains.includes(domain)) {
          throw new Error('This email domain is not allowed');
        }
        return true;
      },
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
      errorMessage: 'Password is required',
    },
    isString: true,
    isLength: {
      options: {
        min: 6,
        max: 32,
      },
      errorMessage: 'Password must be between 6-32 characters long',
    },
    trim: true,
    escape: true,
  },
};
