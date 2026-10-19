export const checkPermissionByRole = (role) => (req, res, next) => {
  // return next(); //* Enable for debugging

  if ((req.user && req.user.role === role) || req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'User does not have the required permissions',
    });
  }
};
