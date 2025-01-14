import { User } from '../utils/classes/User.mjs';
import { createUserInDB, getUserByEmail } from '../models/userModel.mjs';

export const registerUser = async (req, res) => {
  const newUser = new User(req);

  const existingUser = await getUserByEmail(newUser.userDetails.email);

  if (existingUser && existingUser.success === false) {
    return res.render('register.ejs', { message: 'An error occurred while creating the user - Please try again in a few minutes' });
  }

  if (existingUser !== null) { // Check if user exists in DB
    return res.render('register.ejs', { message: 'A user with that email address already exists' });
  }
  const createdUser = await createUserInDB(newUser);

  if (createdUser.success === false) {
    return res.render('register.ejs', { message: 'An error occurred while creating the user - Please try again in a few minutes' });
  }

  return res.redirect('/login');
};
