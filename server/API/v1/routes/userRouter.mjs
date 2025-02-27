import { Router } from 'express';
import { authenticationChecker } from '../../../middlewares/authenticationChecker.mjs';
import { getProfile } from '../../../controllers/userController.mjs';

export const userRouter = Router();

// userRouter.use(authenticationChecker);

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
