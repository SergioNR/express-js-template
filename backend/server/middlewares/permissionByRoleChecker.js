export const checkPermissionByRole = (role) => (req, res, next) => {
  // return next(); //* Enable for debugging

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'The user is not authenticated',
    });
  }

  if (req.user.role === 'admin' || req.user.role === role) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'User does not have the required permissions',
  });
};
