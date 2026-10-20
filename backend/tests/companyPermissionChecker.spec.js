import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/models/roleModel.js', () => ({
  getUserCompanyPermissions: jest.fn(),
}));

const { checkCompanyPermission } = await import('../server/middlewares/companyPermissionChecker.js');
const { getUserCompanyPermissions } = await import('../server/models/roleModel.js');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('checkCompanyPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when req.user is missing (defensive null-guard)', async () => {
    const middleware = checkCompanyPermission('team.view');
    const res = createMockRes();
    const next = jest.fn();

    await middleware({ user: undefined }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
    expect(getUserCompanyPermissions).not.toHaveBeenCalled();
  });

  it('calls next() for global admins without hitting the database (superuser bypass)', async () => {
    const middleware = checkCompanyPermission('team.invite');
    const res = createMockRes();
    const next = jest.fn();

    await middleware({ user: { id: 'user-1', role: 'admin' } }, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(getUserCompanyPermissions).not.toHaveBeenCalled();
  });

  it('calls next() when the user holds a role granting the permission', async () => {
    getUserCompanyPermissions.mockResolvedValue(['team.view', 'team.invite']);
    const middleware = checkCompanyPermission('team.invite');
    const res = createMockRes();
    const next = jest.fn();

    await middleware({ user: { id: 'user-1', role: 'user' } }, res, next);

    expect(getUserCompanyPermissions).toHaveBeenCalledWith('user-1');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when the permission is not granted by any of the user roles', async () => {
    getUserCompanyPermissions.mockResolvedValue(['team.view']);
    const middleware = checkCompanyPermission('team.invite');
    const res = createMockRes();
    const next = jest.fn();

    await middleware({ user: { id: 'user-1', role: 'user' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the user holds no company roles at all', async () => {
    getUserCompanyPermissions.mockResolvedValue([]);
    const middleware = checkCompanyPermission('team.view');
    const res = createMockRes();
    const next = jest.fn();

    await middleware({ user: { id: 'user-1', role: 'user' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
