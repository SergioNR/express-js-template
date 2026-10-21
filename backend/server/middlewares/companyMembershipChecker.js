//* Company-scoped routers (billing, team, files) act on req.user.company_id.
//* Superadmins are SaaS-provider staff with no tenant company, so they are
//* turned away here instead of reaching queries scoped to a null company
export const checkCompanyMembership = () => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({});
  }

  if (!req.user.company_id) {
    return res.status(403).json({
      message: 'This endpoint requires a company membership',
      code: 'COMPANY_MEMBERSHIP_REQUIRED',
    });
  }

  return next();
};
