import { Router } from 'express';
import { checkSchema } from 'express-validator';
import { authenticationChecker } from '../../../middlewares/authenticationChecker.mjs';
import { getProfile, deleteUser, createUser } from '../../../controllers/userController.mjs';
import { createUserValidationSchema } from '../../../utils/validators/createUserSchema.mjs';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.mjs';
import { checkPermissionByRole } from '../../../middlewares/permissionByRoleChecker.mjs';

export const userRouter = Router();

userRouter.post('/register/local', checkSchema(createUserValidationSchema), sanitizerResult, createUser);

userRouter.use(authenticationChecker);

userRouter.use(checkPermissionByRole('customer'));

userRouter.get('/profile', getProfile);

userRouter.delete('/delete', deleteUser);

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
  res.status(404).send('requested route does not exist in /user/');
});
