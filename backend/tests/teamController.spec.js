import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/models/userModel.js', () => ({
  getUserByEmail: jest.fn(),
  getCompanyMembersInDb: jest.fn(),
  getOneCompanyMemberInDb: jest.fn(),
  updateUserCompanyRolesInDb: jest.fn(),
  countUsersWithCompanyRoleInDb: jest.fn(),
  deleteUserInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/models/teamInvitesModel.js', () => ({
  createTeamInviteInDb: jest.fn(),
  getTeamInviteByIdInDb: jest.fn(),
  getTeamInviteByCompanyAndEmailInDb: jest.fn(),
  getCompanyPendingInvitesInDb: jest.fn(),
  deleteTeamInviteInDb: jest.fn(),
  rotateTeamInviteTokenInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/models/roleModel.js', () => ({
  getAllPermissionNames: jest.fn(),
  getAllRolesWithPermissions: jest.fn(),
  getUserCompanyPermissions: jest.fn(),
  getUserCompanyRoleNames: jest.fn(),
  getRoleByName: jest.fn(),
}));

jest.unstable_mockModule('../server/models/companyModel.js', () => ({
  getCompanyByIdInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/utils/userDeletionCleanup.js', () => ({
  cleanupAfterUserDeletion: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../server/integrations/brevo/transactionalEmails/sendTeamInviteToUser.js', () => ({
  sendTeamInviteToUser: jest.fn(),
}));

const {
  createTeamInvite,
  getTeamData,
  removeTeamMember,
  resendTeamInvite,
  revokeTeamInvite,
  updateTeamMemberRole,
} = await import('../server/controllers/teamController.js');
const {
  getUserByEmail,
  getCompanyMembersInDb,
  getOneCompanyMemberInDb,
  updateUserCompanyRolesInDb,
  countUsersWithCompanyRoleInDb,
  deleteUserInDb,
} = await import('../server/models/userModel.js');
const {
  createTeamInviteInDb,
  getTeamInviteByIdInDb,
  getTeamInviteByCompanyAndEmailInDb,
  getCompanyPendingInvitesInDb,
  deleteTeamInviteInDb,
  rotateTeamInviteTokenInDb,
} = await import('../server/models/teamInvitesModel.js');
const {
  getAllPermissionNames,
  getAllRolesWithPermissions,
  getUserCompanyPermissions,
  getUserCompanyRoleNames,
  getRoleByName,
} = await import('../server/models/roleModel.js');
const { getCompanyByIdInDb } = await import('../server/models/companyModel.js');
const { cleanupAfterUserDeletion } = await import('../server/utils/userDeletionCleanup.js');
const { sendTeamInviteToUser } = await import('../server/integrations/brevo/transactionalEmails/sendTeamInviteToUser.js');

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

const caller = {
  id: 'caller-id',
  email: 'owner@acme.test',
  role: 'user',
  company_id: 'company-1',
};

const memberRecord = (id, email, companyRoles, role = 'user') => ({
  id,
  email,
  role,
  created_at: '2026-01-01T00:00:00.000Z',
  UserRoles: companyRoles.map((name) => ({ Role: { id: `role-${name}`, name } })),
});

describe('getTeamData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns members, invites, caller permissions and assignable roles', async () => {
    getCompanyMembersInDb.mockResolvedValue([memberRecord('caller-id', 'owner@acme.test', ['company_owner'])]);
    getCompanyPendingInvitesInDb.mockResolvedValue([
      {
        id: 'invite-1', email: 'new@acme.test', token_expires: '2026-01-08', created_at: '2026-01-01', Role: { name: 'company_member' },
      },
    ]);
    getAllRolesWithPermissions.mockResolvedValue([
      { name: 'company_owner' },
      { name: 'company_member' },
    ]);
    getUserCompanyPermissions.mockResolvedValue(['team.view', 'team.invite']);
    getUserCompanyRoleNames.mockResolvedValue(['company_owner']);

    const res = mockRes();

    await getTeamData({ user: caller }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      members: [expect.objectContaining({ email: 'owner@acme.test', companyRoles: ['company_owner'] })],
      invites: [expect.objectContaining({ email: 'new@acme.test', role: 'company_member' })],
      callerPermissions: ['team.view', 'team.invite'],
      assignableRoles: ['company_admin', 'company_member', 'company_owner'],
    }));
  });

  it('gives superusers every permission and every assignable role', async () => {
    getCompanyMembersInDb.mockResolvedValue([]);
    getCompanyPendingInvitesInDb.mockResolvedValue([]);
    getAllRolesWithPermissions.mockResolvedValue([{ name: 'company_member' }, { name: 'company_owner' }]);
    getAllPermissionNames.mockResolvedValue(['team.invite', 'team.view']);

    const res = mockRes();

    await getTeamData({ user: { ...caller, role: 'admin' } }, res);

    expect(getAllPermissionNames).toHaveBeenCalled();
    expect(getUserCompanyPermissions).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      callerPermissions: ['team.invite', 'team.view'],
      assignableRoles: ['company_member', 'company_owner'],
    }));
  });
});

const createdInvite = (overrides = {}) => ({
  invite: {
    id: 'invite-1',
    email: 'new@acme.test',
    token_expires: '2026-01-08',
    created_at: '2026-01-01',
    ...overrides,
  },
  inviteToken: 'raw-secret-token',
});

describe('createTeamInvite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCompanyByIdInDb.mockResolvedValue({ id: 'company-1', name: 'Acme Corp' });
  });

  it('returns 409 when the email is already registered', async () => {
    getUserByEmail.mockResolvedValue({ id: 'existing-user' });
    const res = mockRes();

    await createTeamInvite({ user: caller, body: { email: 'taken@acme.test', roleName: 'company_member' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(createTeamInviteInDb).not.toHaveBeenCalled();
  });

  it('returns 409 when an invite is already pending for the email', async () => {
    getUserByEmail.mockResolvedValue(null);
    getTeamInviteByCompanyAndEmailInDb.mockResolvedValue({ id: 'invite-1' });
    const res = mockRes();

    await createTeamInvite({ user: caller, body: { email: 'new@acme.test', roleName: 'company_member' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(createTeamInviteInDb).not.toHaveBeenCalled();
  });

  it('returns 404 when the role does not exist', async () => {
    getUserByEmail.mockResolvedValue(null);
    getTeamInviteByCompanyAndEmailInDb.mockResolvedValue(null);
    getRoleByName.mockResolvedValue(null);
    const res = mockRes();

    await createTeamInvite({ user: caller, body: { email: 'new@acme.test', roleName: 'made_up_role' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when a non-superuser invites to a role they do not hold', async () => {
    getUserByEmail.mockResolvedValue(null);
    getTeamInviteByCompanyAndEmailInDb.mockResolvedValue(null);
    getRoleByName.mockResolvedValue({ id: 'role-owner', name: 'company_owner' });
    getUserCompanyRoleNames.mockResolvedValue(['company_member']);
    const res = mockRes();

    await createTeamInvite({ user: caller, body: { email: 'new@acme.test', roleName: 'company_owner' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(createTeamInviteInDb).not.toHaveBeenCalled();
  });

  it('creates the invite, emails the raw token and never returns it', async () => {
    getUserByEmail.mockResolvedValue(null);
    getTeamInviteByCompanyAndEmailInDb.mockResolvedValue(null);
    getRoleByName.mockResolvedValue({ id: 'role-member', name: 'company_member' });
    getUserCompanyRoleNames.mockResolvedValue(['company_owner']);
    createTeamInviteInDb.mockResolvedValue(createdInvite());
    const res = mockRes();

    await createTeamInvite({ user: caller, body: { email: 'new@acme.test', roleName: 'company_member' } }, res);

    expect(createTeamInviteInDb).toHaveBeenCalledWith({
      email: 'new@acme.test',
      companyId: 'company-1',
      roleId: 'role-member',
      invitedBy: 'caller-id',
    });
    expect(sendTeamInviteToUser).toHaveBeenCalledWith('new@acme.test', 'raw-secret-token', 'Acme Corp', 'owner@acme.test');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      invite: {
        id: 'invite-1',
        email: 'new@acme.test',
        role: 'company_member',
        token_expires: '2026-01-08',
        created_at: '2026-01-01',
      },
    });
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('raw-secret-token');
  });

  it('lets superusers grant roles they do not hold themselves', async () => {
    getUserByEmail.mockResolvedValue(null);
    getTeamInviteByCompanyAndEmailInDb.mockResolvedValue(null);
    getRoleByName.mockResolvedValue({ id: 'role-owner', name: 'company_owner' });
    createTeamInviteInDb.mockResolvedValue(createdInvite());
    const res = mockRes();

    await createTeamInvite({ user: { ...caller, role: 'admin' }, body: { email: 'new@acme.test', roleName: 'company_owner' } }, res);

    expect(getUserCompanyRoleNames).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('maps a concurrent-creation P2002 to 409', async () => {
    getUserByEmail.mockResolvedValue(null);
    getTeamInviteByCompanyAndEmailInDb.mockResolvedValue(null);
    getRoleByName.mockResolvedValue({ id: 'role-member', name: 'company_member' });
    getUserCompanyRoleNames.mockResolvedValue(['company_owner']);
    createTeamInviteInDb.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    const res = mockRes();

    await createTeamInvite({ user: caller, body: { email: 'new@acme.test', roleName: 'company_member' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(sendTeamInviteToUser).not.toHaveBeenCalled();
  });
});

describe('resendTeamInvite', () => {
  const pendingInvite = {
    id: 'invite-1', email: 'new@acme.test', role_id: 'role-member', Role: { id: 'role-member', name: 'company_member' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getCompanyByIdInDb.mockResolvedValue({ id: 'company-1', name: 'Acme Corp' });
  });

  it('returns 404 when the invite does not exist in the caller company', async () => {
    getTeamInviteByIdInDb.mockResolvedValue(null);
    const res = mockRes();

    await resendTeamInvite({ user: caller, params: { inviteId: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('revokes and returns 409 when the invitee registered on their own', async () => {
    getTeamInviteByIdInDb.mockResolvedValue({ ...pendingInvite, email: 'taken@acme.test' });
    getUserByEmail.mockResolvedValue({ id: 'existing-user' });
    const res = mockRes();

    await resendTeamInvite({ user: caller, params: { inviteId: 'invite-1' } }, res);

    expect(deleteTeamInviteInDb).toHaveBeenCalledWith('invite-1', 'company-1');
    expect(rotateTeamInviteTokenInDb).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('rotates the token in place, emails the new raw token and never returns it', async () => {
    getTeamInviteByIdInDb.mockResolvedValue(pendingInvite);
    getUserByEmail.mockResolvedValue(null);
    rotateTeamInviteTokenInDb.mockResolvedValue({
      invite: {
        id: 'invite-1', email: 'new@acme.test', token_expires: '2026-01-15', created_at: '2026-01-01',
      },
      inviteToken: 'rotated-secret-token',
    });
    const res = mockRes();

    await resendTeamInvite({ user: caller, params: { inviteId: 'invite-1' } }, res);

    expect(rotateTeamInviteTokenInDb).toHaveBeenCalledWith('invite-1', 'company-1', 'caller-id');
    expect(createTeamInviteInDb).not.toHaveBeenCalled();
    expect(sendTeamInviteToUser).toHaveBeenCalledWith('new@acme.test', 'rotated-secret-token', 'Acme Corp', 'owner@acme.test');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      invite: expect.objectContaining({ id: 'invite-1', role: 'company_member' }),
    });
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('rotated-secret-token');
  });

  it('returns 404 when the invite disappeared before the rotation', async () => {
    getTeamInviteByIdInDb.mockResolvedValue(pendingInvite);
    getUserByEmail.mockResolvedValue(null);
    rotateTeamInviteTokenInDb.mockResolvedValue(null);
    const res = mockRes();

    await resendTeamInvite({ user: caller, params: { inviteId: 'invite-1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(sendTeamInviteToUser).not.toHaveBeenCalled();
  });

  it('maps a rotation P2002 to 409', async () => {
    getTeamInviteByIdInDb.mockResolvedValue(pendingInvite);
    getUserByEmail.mockResolvedValue(null);
    rotateTeamInviteTokenInDb.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    const res = mockRes();

    await resendTeamInvite({ user: caller, params: { inviteId: 'invite-1' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(sendTeamInviteToUser).not.toHaveBeenCalled();
  });
});

describe('revokeTeamInvite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when the invite does not exist in the caller company', async () => {
    getTeamInviteByIdInDb.mockResolvedValue(null);
    const res = mockRes();

    await revokeTeamInvite({ user: caller, params: { inviteId: 'missing' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes the invite scoped by company', async () => {
    getTeamInviteByIdInDb.mockResolvedValue({ id: 'invite-1' });
    deleteTeamInviteInDb.mockResolvedValue(true);
    const res = mockRes();

    await revokeTeamInvite({ user: caller, params: { inviteId: 'invite-1' } }, res);

    expect(deleteTeamInviteInDb).toHaveBeenCalledWith('invite-1', 'company-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('removeTeamMember', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 409 on self-removal', async () => {
    const res = mockRes();

    await removeTeamMember({ user: caller, params: { userId: 'caller-id' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deleteUserInDb).not.toHaveBeenCalled();
  });

  it('returns 404 when the target is not a member of the caller company', async () => {
    getOneCompanyMemberInDb.mockResolvedValue(null);
    const res = mockRes();

    await removeTeamMember({ user: caller, params: { userId: 'outsider' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 when the target is a global admin', async () => {
    getOneCompanyMemberInDb.mockResolvedValue(memberRecord('target', 'admin@acme.test', ['company_member'], 'admin'));
    const res = mockRes();

    await removeTeamMember({ user: caller, params: { userId: 'target' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deleteUserInDb).not.toHaveBeenCalled();
  });

  it('returns 409 when the target is the last company owner', async () => {
    getOneCompanyMemberInDb.mockResolvedValue(memberRecord('target', 'peer@acme.test', ['company_owner']));
    countUsersWithCompanyRoleInDb.mockResolvedValue(1);
    const res = mockRes();

    await removeTeamMember({ user: caller, params: { userId: 'target' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(deleteUserInDb).not.toHaveBeenCalled();
  });

  it('deletes the member and runs the shared cleanup', async () => {
    const target = memberRecord('target', 'peer@acme.test', ['company_member']);
    getOneCompanyMemberInDb.mockResolvedValue(target);
    deleteUserInDb.mockResolvedValue({ ...target, company_id: 'company-1' });
    const res = mockRes();

    await removeTeamMember({ user: caller, params: { userId: 'target' } }, res);

    expect(deleteUserInDb).toHaveBeenCalledWith('target');
    expect(cleanupAfterUserDeletion).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('updateTeamMemberRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 409 on self-change', async () => {
    const res = mockRes();

    await updateTeamMemberRole({ user: caller, params: { userId: 'caller-id' }, body: { roleName: 'company_member' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(updateUserCompanyRolesInDb).not.toHaveBeenCalled();
  });

  it('returns 409 when the target is a global admin', async () => {
    getOneCompanyMemberInDb.mockResolvedValue(memberRecord('target', 'admin@acme.test', ['company_member'], 'admin'));
    const res = mockRes();

    await updateTeamMemberRole({ user: caller, params: { userId: 'target' }, body: { roleName: 'company_member' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 404 when the role does not exist', async () => {
    getOneCompanyMemberInDb.mockResolvedValue(memberRecord('target', 'peer@acme.test', ['company_member']));
    getRoleByName.mockResolvedValue(null);
    const res = mockRes();

    await updateTeamMemberRole({ user: caller, params: { userId: 'target' }, body: { roleName: 'made_up' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when a non-superuser assigns a role they do not hold', async () => {
    getOneCompanyMemberInDb.mockResolvedValue(memberRecord('target', 'peer@acme.test', ['company_member']));
    getRoleByName.mockResolvedValue({ id: 'role-owner', name: 'company_owner' });
    getUserCompanyRoleNames.mockResolvedValue(['company_member']);
    const res = mockRes();

    await updateTeamMemberRole({ user: caller, params: { userId: 'target' }, body: { roleName: 'company_owner' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(updateUserCompanyRolesInDb).not.toHaveBeenCalled();
  });

  it('returns 409 when demoting the last company owner', async () => {
    getOneCompanyMemberInDb.mockResolvedValue(memberRecord('target', 'peer@acme.test', ['company_owner']));
    getRoleByName.mockResolvedValue({ id: 'role-member', name: 'company_member' });
    getUserCompanyRoleNames.mockResolvedValue(['company_owner']);
    countUsersWithCompanyRoleInDb.mockResolvedValue(1);
    const res = mockRes();

    await updateTeamMemberRole({ user: caller, params: { userId: 'target' }, body: { roleName: 'company_member' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(updateUserCompanyRolesInDb).not.toHaveBeenCalled();
  });

  it('updates the role and returns the member shape', async () => {
    getOneCompanyMemberInDb.mockResolvedValue(memberRecord('target', 'peer@acme.test', ['company_member']));
    getRoleByName.mockResolvedValue({ id: 'role-admin', name: 'company_admin' });
    getUserCompanyRoleNames.mockResolvedValue(['company_owner']);
    updateUserCompanyRolesInDb.mockResolvedValue(memberRecord('target', 'peer@acme.test', ['company_admin']));
    const res = mockRes();

    await updateTeamMemberRole({ user: caller, params: { userId: 'target' }, body: { roleName: 'company_admin' } }, res);

    expect(updateUserCompanyRolesInDb).toHaveBeenCalledWith('target', 'role-admin');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      member: expect.objectContaining({ companyRoles: ['company_admin'] }),
    }));
  });
});
