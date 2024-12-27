import passport from "passport";
import LocalStrategy from "passport-local";
import { getUserByEmail, getUserByUserId } from "../models/userModel.mjs";
import { posthogUserLoggedOut, posthogUserSuccessLoggedIn } from "../models/posthogModel.mjs";
import bcrypt from "bcryptjs";
import { logger } from "../config/logger.mjs";

export const passportAuth = passport.authenticate("local", {
    successRedirect: "/user/",
    failureRedirect: "/failed-login",
});

passport.use(
    new LocalStrategy(async(username, password, done) => {
        
        try {
        const user = await getUserByEmail(username);

        if (!user) {

            logger.info({
                message: `Failed login attempt - Incorrect username`,
                userEmail: username,
            });

            return done(null, false, { message: "Incorrect username" });
        };

        bcrypt.compare(password, user.userDetails.password, (err, res) => {


            if (res) {
                // passwords match! log user in

                posthogUserSuccessLoggedIn(user._id);

                return done(null, user)
            } else {
                // passwords do not match!
                logger.info({
                    message: `Failed login attempt - Incorrect password`,
                    userId: user._id,
                });

                return done(null, false, { message: "Incorrect password" })
            }
        });
    } catch(err) {
        return done(err);
    };
}));

export const serializeUser = passport.serializeUser(function(user, done) {
    done(null, user._id);
});
    
export const deserializeUser = passport.deserializeUser(async function(id, done) {
    try {
        const user = await getUserByUserId(id);

        done(null, user);
    } catch(err) {
        done(err);
    };
});

export const passportLogout = (req, res, next) => {   

    req.logout(function (err) {
        if (err) {
            return next(err);
        }

        res.redirect("/"); // Redirect to the homepage
        });
};