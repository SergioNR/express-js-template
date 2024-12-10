export const authenticationChecker = (req, res, next) => {

if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect("/login");
}

next();

};