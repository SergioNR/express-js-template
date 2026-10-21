import { SECURE_TOKEN_PATTERN } from '../secureToken.js';

export const teamInviteTokenQuerySchema = {
  inviteToken: {
    in: ['query'],
    notEmpty: {
      errorMessage: 'Token is required',
    },
    matches: {
      options: SECURE_TOKEN_PATTERN,
      errorMessage: 'Team invite token is malformed',
    },
  },
};
