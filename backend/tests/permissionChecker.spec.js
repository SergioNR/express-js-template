import { jest } from '@jest/globals';
import { checkPermissionByRole } from '../server/middlewares/permissionByRoleChecker.js';

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('checkPermissionByRole', () => {
  it('returns 401 when req.user is missing (defensive null-guard)', () => {
    const middleware = checkPermissionByRole('user');
    const res = createMockRes();
    const next = jest.fn();

    middleware({ user: undefined }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({});
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the role does not match', () => {
    const middleware = checkPermissionByRole('superadmin');
    const res = createMockRes();
    const next = jest.fn();

    middleware({ user: { role: 'user' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when the role matches exactly', () => {
    const middleware = checkPermissionByRole('user');
    const res = createMockRes();
    const next = jest.fn();

    middleware({ user: { role: 'user' } }, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() for superadmins regardless of the required role', () => {
    const middleware = checkPermissionByRole('user');
    const res = createMockRes();
    const next = jest.fn();

    middleware({ user: { role: 'superadmin' } }, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
