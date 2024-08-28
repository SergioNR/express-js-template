import passport from "passport";
import LocalStrategy from "passport-local";
import { getUserByEmail, getUserByUserId } from "../models/userModel.mjs";
import { posthogUserLoggedOut, posthogUserLoggedIn } from "../models/posthog.model.mjs";
import bcrypt from "bcryptjs";

export const passportAuth = passport.authenticate("local", {
    successRedirect: "/user",
    failureRedirect: "/failed-login",
});

passport.use(
    new LocalStrategy(async(username, password, done) => {
        try {
        const user = await getUserByEmail(username);

        if (!user) {
            return done(null, false, { message: "Incorrect username" });
        };

        bcrypt.compare(password, user.password, (err, res) => {
            if (res) {
                // passwords match! log user in
                return done(null, user)
            } else {
                // passwords do not match!
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
        posthogUserLoggedIn(id);
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
        res.redirect("/logout");
        });
};