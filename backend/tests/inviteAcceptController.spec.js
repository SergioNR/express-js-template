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
  deletePasswordResetTokens: jest.fn(),
}));

jest.unstable_mockModule('../server/models/teamInvitesModel.js', () => ({
  getTeamInviteByToken: jest.fn(),
  deleteTeamInviteByTokenSafe: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../server/models/sessionModel.js', () => ({
  deleteUserSessions: jest.fn(),
  linkSessionToUser: jest.fn(),
}));

jest.unstable_mockModule('../server/models/posthogModel.js', () => ({
  posthogUserSuccessLoggedIn: jest.fn(),
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

const { checkTeamInviteValidity, acceptTeamInvite } = await import('../server/controllers/authController.js');
const { getUserByEmail, createUserInDB } = await import('../server/models/userModel.js');
const { getTeamInviteByToken, deleteTeamInviteByTokenSafe } = await import('../server/models/teamInvitesModel.js');

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

const validInvite = {
  id: 'invite-token',
  email: 'new@acme.test',
  company_id: 'company-1',
  role_id: 'role-member',
  token_expires: new Date(Date.now() + 3600000),
  Company: { id: 'company-1', name: 'Acme Corp' },
  Role: { id: 'role-member', name: 'company_member' },
};

describe('checkTeamInviteValidity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when the token does not exist', async () => {
    getTeamInviteByToken.mockResolvedValue(null);
    const res = mockRes();

    await checkTeamInviteValidity({ query: { inviteToken: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when the invite has expired', async () => {
    getTeamInviteByToken.mockResolvedValue({ ...validInvite, token_expires: new Date(Date.now() - 1000) });
    const res = mockRes();

    await checkTeamInviteValidity({ query: { inviteToken: 'invite-token' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns the invited email, company name and role for a valid invite', async () => {
    getTeamInviteByToken.mockResolvedValue(validInvite);
    const res = mockRes();

    await checkTeamInviteValidity({ query: { inviteToken: 'invite-token' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      email: 'new@acme.test',
      companyName: 'Acme Corp',
      roleName: 'company_member',
    }));
  });
});

describe('acceptTeamInvite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when the token does not exist', async () => {
    getTeamInviteByToken.mockResolvedValue(null);
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'missing', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(createUserInDB).not.toHaveBeenCalled();
  });

  it('returns 400 when the invite has expired', async () => {
    getTeamInviteByToken.mockResolvedValue({ ...validInvite, token_expires: new Date(Date.now() - 1000) });
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'invite-token', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createUserInDB).not.toHaveBeenCalled();
    expect(deleteTeamInviteByTokenSafe).not.toHaveBeenCalled();
  });

  it('returns 409 and voids the invite when the email registered on its own', async () => {
    getTeamInviteByToken.mockResolvedValue(validInvite);
    getUserByEmail.mockResolvedValue({ id: 'existing-user' });
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'invite-token', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deleteTeamInviteByTokenSafe).toHaveBeenCalledWith('invite-token');
    expect(createUserInDB).not.toHaveBeenCalled();
  });

  it('creates the user in the invited company with the invited role and consumes the invite', async () => {
    getTeamInviteByToken.mockResolvedValue(validInvite);
    getUserByEmail.mockResolvedValue(null);
    createUserInDB.mockResolvedValue({ id: 'new-user' });
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'invite-token', password: 'Password123' } }, res);

    expect(createUserInDB).toHaveBeenCalledWith(expect.objectContaining({
      username: 'new@acme.test',
      companyId: 'company-1',
      roleId: 'role-member',
    }));
    expect(deleteTeamInviteByTokenSafe).toHaveBeenCalledWith('invite-token');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('maps a concurrent-registration P2002 to 409 and voids the invite', async () => {
    getTeamInviteByToken.mockResolvedValue(validInvite);
    getUserByEmail.mockResolvedValue(null);
    createUserInDB.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'invite-token', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deleteTeamInviteByTokenSafe).toHaveBeenCalledWith('invite-token');
  });
});
