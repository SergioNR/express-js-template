import passport from "passport";
import LocalStrategy from "passport-local";
import { getUserByEmail, getUserByUserId } from "../models/userModel.mjs";
import { posthogUserLoggedOut, posthogUserSuccessLoggedIn } from "../models/posthogModel.mjs";
import bcrypt from "bcryptjs";
import { logger } from "../config/logger.mjs";

export const passportAuth = (req, res, next) => 
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }       

        if (!user) { //* User OR password do not exist or are incorrect

            logger.info({
                message: `Login failed`,
                error: info.message, //* Logging the error message from passport
                userEmail: req.body.username,
            });

            return res.render("login", { message: `The combination of username and password is incorrect or does not exist` }); //* Show a security-oriented error message to the user
        }

        req.logIn(user, (err) => {
            if (err) {

                logger.error({
                    message: `Failed login attempt - Error logging in`,
                    userId: user._id,
                    error: err,
                });

                return next(err);
            }

            posthogUserSuccessLoggedIn(user._id);

            logger.info({
                message: `User logged in successfully`,
                userId: user._id,
            });

            return res.redirect("/user/");
        });
    }) (req, res, next);

passport.use(
    new LocalStrategy(async(userEmail, password, done) => {
        
        try {

        const user = await getUserByEmail(userEmail.toLowerCase());

        console.log(`user` , user);

        if (!user) { //* Triggers if username and password are filled but user DOES NOT exist

            return done(null, false, { message: "User does not exist" });
        };


        bcrypt.compare(password, user.userDetails.password, (err, res) => {

            if (res) {
                // passwords match! log user in

                return done(null, user)
            } else {
                // passwords do not match!

                return done(null, false, { message: "Password is incorrect" });
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

    posthogUserLoggedOut(req.user._id);

    req.logout(function (err) {
        if (err) {
            return next(err);
        }

        res.redirect("/"); // Redirect to the homepage
        });
};