export const acceptTeamInviteSchema = {
  inviteToken: {
    in: ['body'],
    notEmpty: {
      errorMessage: 'Team invite token is required',
    },
    isString: {
      errorMessage: 'Team invite token must be a string',
    },
    isUUID: {
      errorMessage: 'Team invite token must be a valid UUID',
    },
  },
  password: {
    in: ['body'],
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
    //* Same strength rules as self-registration
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
