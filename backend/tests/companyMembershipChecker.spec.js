import { jest } from '@jest/globals';
import { checkCompanyMembership } from '../server/middlewares/companyMembershipChecker.js';

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('checkCompanyMembership', () => {
  it('returns 401 when req.user is missing', () => {
    const res = createMockRes();
    const next = jest.fn();

    checkCompanyMembership()({ user: undefined }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for a superadmin without a company', () => {
    const res = createMockRes();
    const next = jest.fn();

    checkCompanyMembership()({ user: { id: 'staff-1', role: 'superadmin', company_id: null } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'COMPANY_MEMBERSHIP_REQUIRED' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a company member', () => {
    const res = createMockRes();
    const next = jest.fn();

    checkCompanyMembership()({ user: { id: 'user-1', role: 'user', company_id: 'company-1' } }, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
