import { createUser } from '../services/userService.mjs';

export const registerUser = async (req, res) => {
  const userCreation = await createUser(req, res);

  if (userCreation.success === false && userCreation.ERR_CODE === 'USER_CREATION_ERROR') {
    return res.status(500).render('register.ejs', { message: userCreation.message });
  }

  if (userCreation.success === false && userCreation.ERR_CODE === 'USER_ALREADY_EXISTS') {
    return res.status(400).render('register.ejs', { message: userCreation.message });
  }

  return res.redirect('/login');
};
