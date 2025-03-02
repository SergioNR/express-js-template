import { Router } from 'express';
import {
  deleteOneUserById,
  getAllUsers,
  getOneUserById,
} from '../../../controllers/adminController.mjs';
import { authenticationChecker } from '../../../middlewares/authenticationChecker.mjs';

export const adminRouter = Router();

// TODO - fix authentication in tests
// adminRouter.use(authenticationChecker);

adminRouter.get('/', getAllUsers);

adminRouter.get('/:userId', getOneUserById);

adminRouter.delete('/:userId', deleteOneUserById);

// TODO - Define which properties should the admin be able to edit on the user - Commented for now
// adminRouter.patch('/:userId', async (req, res) => {
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

adminRouter.use('/*fallback', (req, res) => {
  res.send('requested route does not exist in /admin/');
});
