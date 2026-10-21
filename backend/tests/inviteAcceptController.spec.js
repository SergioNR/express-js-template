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
  deleteTeamInviteByIdSafe: jest.fn().mockResolvedValue(undefined),
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
const { getTeamInviteByTokenInDb, deleteTeamInviteByIdSafe } = await import('../server/models/teamInvitesModel.js');

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

const validInvite = {
  id: 'invite-1',
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
    getTeamInviteByTokenInDb.mockResolvedValue(null);
    const res = mockRes();

    await checkTeamInviteValidity({ query: { inviteToken: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when the invite has expired', async () => {
    getTeamInviteByTokenInDb.mockResolvedValue({ ...validInvite, token_expires: new Date(Date.now() - 1000) });
    const res = mockRes();

    await checkTeamInviteValidity({ query: { inviteToken: 'invite-token' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('looks the invite up by the raw token (the model hashes it)', async () => {
    getTeamInviteByTokenInDb.mockResolvedValue(validInvite);
    const res = mockRes();

    await checkTeamInviteValidity({ query: { inviteToken: 'raw-token' } }, res);

    expect(getTeamInviteByTokenInDb).toHaveBeenCalledWith('raw-token');
  });

  it('returns the invited email, company name and role for a valid invite', async () => {
    getTeamInviteByTokenInDb.mockResolvedValue(validInvite);
    const res = mockRes();

    await checkTeamInviteValidity({ query: { inviteToken: 'invite-token' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
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
    getTeamInviteByTokenInDb.mockResolvedValue(null);
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'missing', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(createUserInDB).not.toHaveBeenCalled();
  });

  it('returns 400 when the invite has expired', async () => {
    getTeamInviteByTokenInDb.mockResolvedValue({ ...validInvite, token_expires: new Date(Date.now() - 1000) });
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'invite-token', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createUserInDB).not.toHaveBeenCalled();
    expect(deleteTeamInviteByIdSafe).not.toHaveBeenCalled();
  });

  it('returns 409 and voids the invite when the email registered on its own', async () => {
    getTeamInviteByTokenInDb.mockResolvedValue(validInvite);
    getUserByEmail.mockResolvedValue({ id: 'existing-user' });
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'invite-token', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deleteTeamInviteByIdSafe).toHaveBeenCalledWith('invite-1');
    expect(createUserInDB).not.toHaveBeenCalled();
  });

  it('creates the user in the invited company and consumes the invite in the same transaction', async () => {
    getTeamInviteByTokenInDb.mockResolvedValue(validInvite);
    getUserByEmail.mockResolvedValue(null);
    createUserInDB.mockResolvedValue({ id: 'new-user' });
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'invite-token', password: 'Password123' } }, res);

    expect(createUserInDB).toHaveBeenCalledWith(expect.objectContaining({
      username: 'new@acme.test',
      companyId: 'company-1',
      roleId: 'role-member',
      inviteId: 'invite-1',
    }));
    //* Consumed inside the user-creation transaction, not afterwards
    expect(deleteTeamInviteByIdSafe).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('maps a concurrent-registration P2002 to 409 and voids the invite', async () => {
    getTeamInviteByTokenInDb.mockResolvedValue(validInvite);
    getUserByEmail.mockResolvedValue(null);
    createUserInDB.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    const res = mockRes();

    await acceptTeamInvite({ body: { inviteToken: 'invite-token', password: 'Password123' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deleteTeamInviteByIdSafe).toHaveBeenCalledWith('invite-1');
  });
});
