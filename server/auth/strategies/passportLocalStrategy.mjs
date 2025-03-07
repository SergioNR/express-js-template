import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../models/userModel.mjs';

export const localStrategy = new LocalStrategy(async (userEmail, password, done) => {
  try {
    const user = await getUserByEmail(userEmail);

    if (!user) {
      return done(null, false, { message: 'User does not exist' });
    }

    return bcrypt.compare(password, user.password, (err, res) => {
      if (res) {
        return done(null, user);
      }

      return done(null, false, { message: 'Password is incorrect' });
    });
  } catch (err) {
    return done(err);
  }
});
