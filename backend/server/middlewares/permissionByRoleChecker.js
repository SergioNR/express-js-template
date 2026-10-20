export const checkPermissionByRole = (role) => (req, res, next) => {
  // return next(); //* Enable for debugging

  if (!req.user) {
    return res.status(401).json({ success: false });
  }

  if (req.user.role === 'admin' || req.user.role === role) {
    return next();
  }

  return res.status(403).json({ success: false });
};
