import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserByUserId, updateLastLoginDate } from '../models/userModel.mjs';
import { posthogUserLoggedOut, posthogUserSuccessLoggedIn } from '../models/posthogModel.mjs';
import {
  logUserLoggedInSuccessfully,
  logError,
  logUserLoggedOut,
} from '../config/loggerFunctions.mjs';

export const passportAuth = (req, res, next) => passport.authenticate('local', (err, user, info) => {
  if (err) {
    return next(err);
  }

  if (!user) { //* Triggers when user does not exist
    logError('login attempt failed', err, info);

    return res.render('login', { message: 'The combination of username and password is incorrect or does not exist' }); //* Show a security-oriented error message to the user
  }

  return req.logIn(user, (error) => {
    if (error) {
      logError('error in user login', err);

      return next(err);
    }

    updateLastLoginDate(user._id);

    posthogUserSuccessLoggedIn(user._id, 'passportLocalStrategy');

    logUserLoggedInSuccessfully(user._id, 'passportLocalStrategy');

    return res.redirect('/user/');
  });
})(req, res, next);

passport.use(
  new LocalStrategy(async (userEmail, password, done) => {
    try {
      const user = await getUserByEmail(userEmail);

      if (!user) { //* Triggers if username and password are filled but user DOES NOT exist
        return done(null, false, { message: 'User does not exist' });
      }

      return bcrypt.compare(password, user.userDetails.password, (err, res) => {
        if (res) {
          // passwords match! log user in

          return done(null, user);
        }
        // passwords do not match!

        return done(null, false, { message: 'Password is incorrect' });
      });
    } catch (err) {
      return done(err);
    }
  }),
);

export const serializeUser = passport.serializeUser((user, done) => {
  done(null, user._id);
});

export const deserializeUser = passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserByUserId(id);

    done(null, user);
  } catch (err) {
    done(err);
  }
});

export const passportLogout = (req, res, next) => {
  posthogUserLoggedOut(req.user._id);

  logUserLoggedOut(req.user._id);

  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
    });

    return res.redirect('/'); // Redirect to the homepage
  });
};
