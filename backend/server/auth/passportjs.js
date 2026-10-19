import passport from 'passport';
import { getUserById } from '../models/userModel.js';

import { localStrategy } from './strategies/passportLocalStrategy.js';

//* Register the different strategies
passport.use(localStrategy);

//* Serialize and deserialize the user
//* This is necessary to keep the user logged in on localStrategy
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);

    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
