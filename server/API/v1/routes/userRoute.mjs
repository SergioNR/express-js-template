import { Router } from 'express';
import { checkSchema } from 'express-validator';
import {
  getAllUsers,
  getOneUserById,
} from '../../../services/userService.mjs';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.mjs';
import { userIdInputValidator } from '../../../utils/validators/userIdInputValidator.mjs';

export const userApi = Router();

userApi.get('/', async (req, res) => {
  const users = await getAllUsers(req);

  if (!users || users.success === false) {
    return res.status(404).json({
      success: false,
      message: 'Users not found',
    });
  }

  return res.status(200).json({
    success: true,
    users: users,
  });
});

userApi.get('/:userId', checkSchema(userIdInputValidator), sanitizerResult, async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId',
      errors: req.sanitizedErrors,
    });
  }

  const user = await getOneUserById(req);

  if (!user || user.success === false) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  return res.status(200).json({
    success: true,
    data: user,
  });
});

// userApi.patch('/:userId', async (req, res) => {
//   const user = await getUserById(req.params.userId);
//   if (!user) {
//     return res.status(404).json({ success: false, message: 'User not found' });
//   }
//   return res.status(200).json({ success: true, data: user });
// });

userApi.delete('/:userId', checkSchema(userIdInputValidator), sanitizerResult, async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId',
      errors: req.sanitizedErrors,
    });
  }

  return res.status(200).json({
    message: 'this route is WIP',
  });

  // const user = await getUserById(req.params.userId);
  // if (!user) {
  //   return res.status(404).json({ success: false, message: 'User not found' });
  // }
  // return res.status(200).json({ success: true, data: user });
});

userApi.use('/*fallback', (req, res) => {
  res.send('requested route does not exist in /user/');
});

// userRouter.get("/:userId/", getUser);
/*
* Gets the profile information of the user - we are searching
* by userId because this is an internal api where we have the userId
*/
