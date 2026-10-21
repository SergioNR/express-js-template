export const teamInviteTokenQuerySchema = {
  inviteToken: {
    in: ['query'],
    notEmpty: {
      errorMessage: 'Token is required',
    },
    isUUID: {
      errorMessage: 'Team invite token must be a valid UUID',
    },
  },
};
