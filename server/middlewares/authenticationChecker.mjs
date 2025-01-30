export const authenticationChecker = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect('/login'); //TODO this is from .ejs times, need to make it so it forces reactjs to prompt the user to login
  }

  next();
};
