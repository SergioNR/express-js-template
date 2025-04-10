export const checkPermissionByRole = (role) => (req, res, next) => {
  // return next(); //* Enable for debugging

  if (req.user && req.user.role === role) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'User does not have the required permissions',
    });
  }
};
