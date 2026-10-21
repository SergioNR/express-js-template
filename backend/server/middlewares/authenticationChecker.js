export const checkAuthentication = () => (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({});
  }

  return next();
};
