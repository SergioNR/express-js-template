export const checkAuthentication = () => (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json(
      {
        success: false,
        message: 'The user is not authenticated',
      },
    );
  }

  return next();
};
