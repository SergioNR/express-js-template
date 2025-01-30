import { Router } from 'express';
import { checkSchema } from 'express-validator';
import { createUser } from '../controllers/userController.mjs';
import { sanitizerResult } from '../middlewares/sanitizerResult.mjs';
import { createUserValidationSchema } from '../utils/validators/createUserSchema.mjs';
// import { updatePasswordSchema } from '../utils/validators/updatePasswordSchema.mjs';

export const authRouter = Router();

authRouter.post('/register/', checkSchema(createUserValidationSchema), sanitizerResult, createUser);

// authRouter.patch('/updateUserPassword', checkSchema(updatePasswordSchema), sanitizerResult,
// async (req, res) => {
//   if (req.sanitizedErrors) {
//     return res.status(400).json({
//       success: false,
//       message: req.sanitizedErrors,
//     });
//   }

//   const passwordUpdate = await updateUserPassword(req);

//   if (passwordUpdate.success === false && passwordUpdate.ERR_CODE === 'INCORRECT_PASSWORD') {
//     return res.status(401).json({
//       success: false,
//       message: passwordUpdate.message,
//     });
//   }

//   if (passwordUpdate.success === false) {
//     return res.status(400).json({
//       success: false,
//       message: passwordUpdate.message,
//     });
//   }

//   return res.status(200).json({
//     success: true,
//     message: 'Password updated',
//   });
// });

// authRouter.post('/forgot-password', async (req, res) => {
//   //

//   res.status(200).json({
//     success: true,
//     message: 'This route is a WIP',
//   });
// });

// authRouter.post('/reset-password', async (req, res) => {
//   //

//   res.status(200).json({
//     success: true,
//     message: 'This route is a WIP',
//   });
// });

authRouter.get('/*fallback', (req, res) => {
  res.status(404).send('requested API Route does not exist in the userRouter');
});
