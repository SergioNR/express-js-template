import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../models/userModel.js';

//* Constant invalid hash used to equalize response times for nonexistent users,
//* preventing user enumeration through login response timing
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-attack-mitigation-dummy-hash', 10);

export const localStrategy = new LocalStrategy(async (userEmail, password, done) => {
  try {
    const user = await getUserByEmail(userEmail);

    if (!user) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return done(null, false, { message: 'The combination of email and password is incorrect' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return done(null, false, { message: 'The combination of email and password is incorrect' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
});
