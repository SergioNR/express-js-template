import passport from 'passport';
import { getUserById } from '../models/userModel.mjs';

import { localStrategy } from './strategies/passportLocalStrategy.mjs';

//* Register the different strategies
passport.use(localStrategy);

//*  Serialize and deserialize the user
//* This is necessary to keep the user logged in on localStrategy
export const serializeUser = passport.serializeUser((user, done) => {
  done(null, user.id);
});

export const deserializeUser = passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);

    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
