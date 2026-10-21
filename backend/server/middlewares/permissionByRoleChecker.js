export const checkPermissionByRole = (role) => (req, res, next) => {
  // return next(); //* Enable for debugging

  if (!req.user) {
    return res.status(401).json({});
  }

  //* Superadmins (SaaS-provider staff) pass every platform-role gate -
  //* company-scoped routers additionally require checkCompanyMembership()
  if (req.user.role === 'superadmin' || req.user.role === role) {
    return next();
  }

  return res.status(403).json({});
};
