export const authenticationChecker = (req, res, next) => {
  return next(); //* Enable for debugging

  if (!req.isAuthenticated()) {
    return res.status(401).json(
      {
        success: false,
        message: 'The user is not authenticated or the route does not exist',
      },
    );
  }

  return next();
};
