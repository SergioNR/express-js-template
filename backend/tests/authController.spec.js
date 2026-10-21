import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/models/userModel.js', () => ({
  getUserByEmail: jest.fn(),
  createUserInDB: jest.fn(),
  getUserPassword: jest.fn(),
  updateUserPasswordInDB: jest.fn(),
  updateUserLastLoginDate: jest.fn(),
}));

jest.unstable_mockModule('../server/models/passwordResetTokensModel.js', () => ({
  createPasswordResetToken: jest.fn(),
  getPasswordResetTokenData: jest.fn(),
  resetUserPasswordWithTokenInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/models/teamInvitesModel.js', () => ({
  getTeamInviteByTokenInDb: jest.fn(),
  deleteTeamInviteByIdSafe: jest.fn(),
}));

jest.unstable_mockModule('../server/models/sessionModel.js', () => ({
  deleteUserSessions: jest.fn(),
  linkSessionToUser: jest.fn(),
}));

jest.unstable_mockModule('../server/models/posthogModel.js', () => ({
  posthogUserSuccessLoggedIn: jest.fn(),
}));

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logError: jest.fn(),
}));

jest.unstable_mockModule('../server/auth/passportjs.js', () => ({
  default: { authenticate: jest.fn() },
}));

jest.unstable_mockModule('../server/integrations/brevo/transactionalEmails/sendResetPasswordTokenToUser.js', () => ({
  sendResetPasswordTokenToUser: jest.fn(),
}));

jest.unstable_mockModule('../server/integrations/brevo/transactionalEmails/sendExistingAccountNoticeToUser.js', () => ({
  sendExistingAccountNoticeToUser: jest.fn(),
}));

const {
  checkPasswordResetTokenValidity,
  loginLocal,
  registerUser,
  requestPasswordResetToken,
  updateRecoveredUserPassword,
} = await import('../server/controllers/authController.js');
const { getUserByEmail, createUserInDB } = await import('../server/models/userModel.js');
const {
  createPasswordResetToken,
  getPasswordResetTokenData,
  resetUserPasswordWithTokenInDb,
} = await import('../server/models/passwordResetTokensModel.js');
const { linkSessionToUser } = await import('../server/models/sessionModel.js');
const { posthogUserSuccessLoggedIn } = await import('../server/models/posthogModel.js');
const { logError } = await import('../server/config/loggerFunctions.js');
const { default: passport } = await import('../server/auth/passportjs.js');
const { sendResetPasswordTokenToUser } = await import('../server/integrations/brevo/transactionalEmails/sendResetPasswordTokenToUser.js');
const { sendExistingAccountNoticeToUser } = await import('../server/integrations/brevo/transactionalEmails/sendExistingAccountNoticeToUser.js');

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

//* Lets detached (fire-and-forget) work finish before asserting on it
const flushBackgroundWork = () => new Promise((resolve) => { setTimeout(resolve, 0); });

//* Background work that runs bcrypt needs more than one tick
const waitUntilCalled = async (mockFn) => {
  for (let attempt = 0; attempt < 300 && mockFn.mock.calls.length === 0; attempt++) {
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
};

describe('requestPasswordResetToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds before any lookup happens and with the same body for unknown emails', async () => {
    let resolveLookup;
    getUserByEmail.mockReturnValue(new Promise((resolve) => { resolveLookup = resolve; }));
    const res = mockRes();

    await requestPasswordResetToken({ body: { email: 'nobody@acme.test' } }, res);

    //* Response already sent while the lookup is still pending
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'If this email exists, a reset link will be sent' });

    resolveLookup(null);
    await flushBackgroundWork();

    expect(createPasswordResetToken).not.toHaveBeenCalled();
    expect(sendResetPasswordTokenToUser).not.toHaveBeenCalled();
  });

  it('creates a token and emails the raw token to the stored address in the background', async () => {
    getUserByEmail.mockResolvedValue({ id: 'user-1', email: 'stored@acme.test' });
    createPasswordResetToken.mockResolvedValue('raw-reset-token');
    const res = mockRes();

    await requestPasswordResetToken({ body: { email: 'stored@acme.test' } }, res);
    await flushBackgroundWork();

    expect(res.json).toHaveBeenCalledWith({ message: 'If this email exists, a reset link will be sent' });
    expect(createPasswordResetToken).toHaveBeenCalledWith('user-1');
    expect(sendResetPasswordTokenToUser).toHaveBeenCalledWith('stored@acme.test', 'raw-reset-token');
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('raw-reset-token');
  });

  it('swallows and logs background failures', async () => {
    getUserByEmail.mockResolvedValue({ id: 'user-1', email: 'stored@acme.test' });
    createPasswordResetToken.mockRejectedValue(new Error('db down'));
    const res = mockRes();

    await requestPasswordResetToken({ body: { email: 'stored@acme.test' } }, res);
    await flushBackgroundWork();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(logError).toHaveBeenCalled();
  });
});

describe('checkPasswordResetTokenValidity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for an unknown token', async () => {
    getPasswordResetTokenData.mockResolvedValue(null);
    const res = mockRes();

    await checkPasswordResetTokenValidity({ query: { passwordResetToken: 'raw' } }, res);

    expect(getPasswordResetTokenData).toHaveBeenCalledWith('raw');
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for an expired token', async () => {
    getPasswordResetTokenData.mockResolvedValue({ user_id: 'user-1', token_expires: new Date(Date.now() - 1000) });
    const res = mockRes();

    await checkPasswordResetTokenValidity({ query: { passwordResetToken: 'raw' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('updateRecoveredUserPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consumes the token and updates the password in one model transaction', async () => {
    resetUserPasswordWithTokenInDb.mockResolvedValue({ userId: 'user-1' });
    const res = mockRes();

    await updateRecoveredUserPassword({ body: { newPassword: 'Password123', passwordResetToken: 'raw' } }, res);

    expect(resetUserPasswordWithTokenInDb).toHaveBeenCalledWith('raw', expect.stringMatching(/^\$2[aby]\$/));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('answers 400 when the token was already used, expired or is unknown (single use)', async () => {
    resetUserPasswordWithTokenInDb
      .mockResolvedValueOnce({ userId: 'user-1' })
      .mockResolvedValueOnce(null);

    const firstRes = mockRes();
    await updateRecoveredUserPassword({ body: { newPassword: 'Password123', passwordResetToken: 'raw' } }, firstRes);

    const secondRes = mockRes();
    await updateRecoveredUserPassword({ body: { newPassword: 'Password123', passwordResetToken: 'raw' } }, secondRes);

    expect(firstRes.status).toHaveBeenCalledWith(200);
    expect(secondRes.status).toHaveBeenCalledWith(400);
  });

  it('propagates transaction errors instead of swallowing them', async () => {
    resetUserPasswordWithTokenInDb.mockRejectedValue(new Error('db down'));
    const res = mockRes();

    await expect(updateRecoveredUserPassword({ body: { newPassword: 'Password123', passwordResetToken: 'raw' } }, res)).rejects.toThrow('db down');
  });
});

describe('registerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds 201 before checking whether the account exists', async () => {
    getUserByEmail.mockReturnValue(new Promise(() => {}));
    const res = mockRes();

    await registerUser({ body: { username: 'new@acme.test', companyName: 'Acme Corp', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({});
    expect(createUserInDB).not.toHaveBeenCalled();
  });

  it('creates the account and its company in the background for a new email', async () => {
    getUserByEmail.mockResolvedValue(null);
    createUserInDB.mockResolvedValue({ id: 'new-user' });
    const res = mockRes();

    await registerUser({ body: { username: 'new@acme.test', companyName: 'Acme Corp', password: 'Password123' } }, res);
    await waitUntilCalled(createUserInDB);

    expect(createUserInDB).toHaveBeenCalledWith({
      username: 'new@acme.test',
      password: expect.stringMatching(/^\$2[aby]\$/),
      companyName: 'Acme Corp',
    });
    expect(sendExistingAccountNoticeToUser).not.toHaveBeenCalled();
  });

  it('sends the existing-account notice to the stored address and creates nothing', async () => {
    getUserByEmail.mockResolvedValue({ id: 'existing', email: 'stored@acme.test' });
    const res = mockRes();

    await registerUser({ body: { username: 'stored@acme.test', companyName: 'Acme Corp', password: 'Password123' } }, res);
    await flushBackgroundWork();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({});
    expect(sendExistingAccountNoticeToUser).toHaveBeenCalledWith('stored@acme.test');
    expect(createUserInDB).not.toHaveBeenCalled();
  });
});

describe('loginLocal', () => {
  const user = { id: 'user-1', role: 'user' };

  const runLogin = async (req, res, next) => {
    passport.authenticate.mockImplementation((strategy, callback) => () => callback(null, user));
    loginLocal(req, res, next);
    await flushBackgroundWork();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links the session to the user before answering', async () => {
    linkSessionToUser.mockResolvedValue(undefined);
    const req = {
      sessionID: 'sid-1',
      login: (loggedUser, callback) => callback(),
      session: { destroy: jest.fn((callback) => callback()) },
    };
    const res = mockRes();
    const next = jest.fn();

    await runLogin(req, res, next);

    expect(linkSessionToUser).toHaveBeenCalledWith('sid-1', 'user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(posthogUserSuccessLoggedIn).toHaveBeenCalled();
  });

  it('fails the login and destroys the session when linking fails', async () => {
    const linkError = new Error('db down');
    linkSessionToUser.mockRejectedValue(linkError);
    const req = {
      sessionID: 'sid-1',
      login: (loggedUser, callback) => callback(),
      session: { destroy: jest.fn((callback) => callback()) },
    };
    const res = mockRes();
    const next = jest.fn();

    await runLogin(req, res, next);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(linkError);
    expect(res.status).not.toHaveBeenCalled();
  });
});
