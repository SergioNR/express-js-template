import { User } from '../utils/classes/User.mjs';
import { createUserInDB, getUserByEmail } from '../models/userModel.mjs';

export const createUser = async (req) => {
  const userData = {
    username: req.body.username,
    password: req.body.password,
  };

  const existingUser = await getUserByEmail(userData.username);

  if (existingUser && existingUser.success === false) {
    return {
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes', //* Error generated on getUserByEmail() error
    };
  }

  if (existingUser !== null) {
    return {
      success: false,
      ERR_CODE: 'USER_ALREADY_EXISTS',
      message: 'A user with that email address already exists',
    };
  }

  const createdUser = await createUserInDB(new User(userData));

  if (createdUser.success === false) {
    return {
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes', //* Error generated on createUserInDB() error
    };
  }

  return {
    success: true,
    message: 'User created successfully',
  };
};
