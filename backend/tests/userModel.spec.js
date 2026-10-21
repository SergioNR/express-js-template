import { jest } from '@jest/globals';

//* The generated Prisma client needs a live database, so `$transaction` runs
//* the callback against a mocked interactive-transaction client (`tx`)
const tx = {
  $queryRaw: jest.fn(),
  user: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  teamInvites: {
    deleteMany: jest.fn(),
  },
  session: {
    deleteMany: jest.fn(),
  },
  passwordResetTokens: {
    deleteMany: jest.fn(),
  },
};

jest.unstable_mockModule('../server/config/prismaClient.js', () => ({
  prisma: {
    $transaction: jest.fn((callback) => callback(tx)),
    role: {
      findUnique: jest.fn(),
    },
  },
}));

jest.unstable_mockModule('../server/models/posthogModel.js', () => ({
  posthogUserSignedUp: jest.fn(),
  posthogUserDeleteAccount: jest.fn(),
}));

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logPasswordResetTokenCreated: jest.fn(),
}));

const { createUserInDB, updateCompanyMemberRoleInDb, updateUserPasswordInDB } = await import('../server/models/userModel.js');
const { prisma } = await import('../server/config/prismaClient.js');
const { posthogUserSignedUp } = await import('../server/models/posthogModel.js');
const { hashSecureToken } = await import('../server/utils/secureToken.js');

const inviteAcceptance = {
  username: 'new@acme.test',
  password: '$2a$12$hash',
  companyId: 'company-1',
  roleId: 'role-member',
  inviteId: 'invite-1',
  inviteToken: 'raw-invite-token',
};

describe('createUserInDB - invite acceptance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consumes the invite conditionally (id + digest + not expired) before creating the user', async () => {
    tx.teamInvites.deleteMany.mockResolvedValue({ count: 1 });
    tx.user.create.mockResolvedValue({ id: 'new-user', role: 'user' });

    const createdUser = await createUserInDB(inviteAcceptance);

    expect(tx.teamInvites.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'invite-1',
        token_hash: hashSecureToken('raw-invite-token'),
        token_expires: { gt: expect.any(Date) },
      },
    });
    expect(tx.teamInvites.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(tx.user.create.mock.invocationCallOrder[0]);
    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: 'new@acme.test', company_id: 'company-1', role: 'user' }),
      omit: { password: true },
    }));
    expect(createdUser).toEqual({ id: 'new-user', role: 'user' });
    expect(posthogUserSignedUp).toHaveBeenCalled();
  });

  it('creates nothing and resolves to null when the invite was already consumed, revoked or expired', async () => {
    tx.teamInvites.deleteMany.mockResolvedValue({ count: 0 });

    const createdUser = await createUserInDB(inviteAcceptance);

    expect(createdUser).toBeNull();
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(posthogUserSignedUp).not.toHaveBeenCalled();
  });
});

describe('createUserInDB - self-registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws a clear error when the company owner role was never seeded', async () => {
    prisma.role.findUnique.mockResolvedValue(null);

    await expect(createUserInDB({ username: 'new@acme.test', password: 'hash', companyName: 'Acme' })).rejects.toThrow('Company owner role');
  });
});

describe('updateUserPasswordInDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes the hash, revokes reset tokens and every other session in one transaction', async () => {
    tx.user.update.mockResolvedValue({ id: 'user-1' });
    tx.passwordResetTokens.deleteMany.mockResolvedValue({ count: 1 });
    tx.session.deleteMany.mockResolvedValue({ count: 2 });

    const updatedUser = await updateUserPasswordInDB('user-1', 'new-hash', { keepSessionId: 'sid-current' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: { password: 'new-hash' },
    }));
    expect(tx.passwordResetTokens.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'user-1' } });
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'user-1', sid: { not: 'sid-current' } } });
    expect(updatedUser).toEqual({ id: 'user-1' });
  });

  it('propagates a failing step so nothing half-applied is reported as success', async () => {
    tx.user.update.mockResolvedValue({ id: 'user-1' });
    tx.passwordResetTokens.deleteMany.mockResolvedValue({ count: 0 });
    tx.session.deleteMany.mockRejectedValue(new Error('db down'));

    await expect(updateUserPasswordInDB('user-1', 'new-hash', { keepSessionId: 'sid-current' })).rejects.toThrow('db down');
  });
});

describe('updateCompanyMemberRoleInDb', () => {
  const memberWithRoles = (roleNames) => ({
    UserRoles: roleNames.map((name) => ({ Role: { name } })),
  });

  const memberRole = { id: 'role-member', name: 'company_member' };

  beforeEach(() => {
    jest.clearAllMocks();
    tx.user.count.mockResolvedValue(2);
    tx.teamInvites.deleteMany.mockResolvedValue({ count: 0 });
  });

  it('re-reads the caller roles under the lock and refuses when they no longer outrank the target', async () => {
    tx.user.findFirst
      .mockResolvedValueOnce(memberWithRoles(['company_admin'])) //* target
      .mockResolvedValueOnce(memberWithRoles(['company_admin'])); //* caller, demoted meanwhile

    const result = await updateCompanyMemberRoleInDb('target', 'company-1', memberRole, { callerId: 'caller' });

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'forbidden' });
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('refuses when the caller is no longer a member of the company', async () => {
    tx.user.findFirst
      .mockResolvedValueOnce(memberWithRoles(['company_member']))
      .mockResolvedValueOnce(null);

    const result = await updateCompanyMemberRoleInDb('target', 'company-1', memberRole, { callerId: 'caller' });

    expect(result).toEqual({ status: 'forbidden' });
  });

  it('refuses when the caller cannot grant the new role', async () => {
    tx.user.findFirst
      .mockResolvedValueOnce(memberWithRoles(['company_member']))
      .mockResolvedValueOnce(memberWithRoles(['company_admin']));

    const result = await updateCompanyMemberRoleInDb('target', 'company-1', { id: 'role-owner', name: 'company_owner' }, { callerId: 'caller' });

    expect(result).toEqual({ status: 'forbidden' });
  });

  it('updates the role and voids the invites the demoted member can no longer vouch for', async () => {
    tx.user.findFirst
      .mockResolvedValueOnce(memberWithRoles(['company_admin']))
      .mockResolvedValueOnce(memberWithRoles(['company_owner']));
    tx.user.update.mockResolvedValue({ id: 'target', UserRoles: [{ Role: { name: 'company_member' } }] });

    const result = await updateCompanyMemberRoleInDb('target', 'company-1', memberRole, { callerId: 'caller' });

    expect(result.status).toBe('updated');
    expect(tx.teamInvites.deleteMany).toHaveBeenCalledWith({
      where: {
        invited_by: 'target',
        Role: { name: { notIn: ['company_member'] } },
      },
    });
  });
});
