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
  password: {
    notEmpty: {
      errorMessage: 'Password is required',
    },
    isString: true,
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
