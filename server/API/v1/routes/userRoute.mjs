import { Router } from 'express';
import { checkSchema } from 'express-validator';
import {
  deleteOneUserById,
  getAllUsers,
  getOneUserById,
} from '../../../controllers/userController.mjs';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.mjs';
import { userIdInputValidator } from '../../../utils/validators/userIdInputValidator.mjs';

export const userApi = Router();

userApi.get('/', getAllUsers);

userApi.get('/:userId', checkSchema(userIdInputValidator), sanitizerResult, getOneUserById);

userApi.delete('/:userId', checkSchema(userIdInputValidator), sanitizerResult, deleteOneUserById);

// userApi.patch('/:userId', async (req, res) => {
//   const user = await getUserById(req.params.userId);
//   if (!user) {
//     return res.status(404).json({ success: false, message: 'User not found' });
//   }
//   return res.status(200).json({ success: true, data: user });
// });

// const user = await getUserById(req.params.userId);
// if (!user) {
//   return res.status(404).json({ success: false, message: 'User not found' });
// }
// return res.status(200).json({ success: true, data: user });
// });

userApi.use('/*fallback', (req, res) => {
  res.send('requested route does not exist in /user/');
});
