import { Router } from 'express';
import { checkSchema } from 'express-validator';
import { authenticationChecker } from '../../../middlewares/authenticationChecker.mjs';
import { getProfile, deleteUser, createUser } from '../../../controllers/userController.mjs';
import { createUserValidationSchema } from '../../../utils/validators/createUserSchema.mjs';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.mjs';

export const userRouter = Router();

userRouter.post('/register/local', checkSchema(createUserValidationSchema), sanitizerResult, createUser);


userRouter.get('/profile', getProfile);

// userRouter.get('/:userId', getOneUserById);

// userRouter.delete('/:userId', deleteOneUserById);

// userRouter.patch('/:userId', async (req, res) => {
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

userRouter.use('/*fallback', (req, res) => {
  res.send('requested route does not exist in /user/');
});
