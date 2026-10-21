export const userLoginValidationSchema = {
  username: {
    trim: true,
    isEmail: {
      errorMessage: 'Invalid email or password',
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
  },
  password: {
    //* Bound the input so bcrypt never hashes attacker-sized payloads
    //* (bcrypt only uses the first 72 bytes anyway)
    isString: {
      errorMessage: 'Invalid email or password',
    },
    notEmpty: {
      errorMessage: 'Invalid email or password',
    },
    isLength: {
      options: { max: 128 },
      errorMessage: 'Invalid email or password',
    },
  },
};
