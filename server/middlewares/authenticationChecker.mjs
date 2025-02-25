export const authenticationChecker = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json(
      {
        success: false,
        message: 'user is not authenticated',
      },
    );
  }

  return next();
};
