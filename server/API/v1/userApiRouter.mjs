import { Router } from 'express';
import { checkSchema } from 'express-validator';
import {
  createUser,
  updateUserPassword,
} from '../../services/userService.mjs';
import { createUserValidationSchema } from '../../utils/validators/createUserSchema.mjs';
import { sanitizerResult } from '../../middlewares/sanitizerResult.mjs';
import { updatePasswordSchema } from '../../utils/validators/updatePasswordSchema.mjs';

export const userApi = Router();

userApi.get('/', (req, res) => {
  res.status(200).json({
    message: 'This route is a work in progress',

  });
});

userApi.post('/createUser', checkSchema(createUserValidationSchema), sanitizerResult, async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      errors: req.sanitizedErrors,
    });
  }

  const userCreation = await createUser(req);

  return res.status(200).json(userCreation);
});

userApi.patch('/updateUserPassword', checkSchema(updatePasswordSchema), sanitizerResult, async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: req.sanitizedErrors,
    });
  }

  const passwordUpdate = await updateUserPassword(req);

  if (passwordUpdate.success === false && passwordUpdate.ERR_CODE === 'INCORRECT_PASSWORD') {
    return res.status(401).json({
      success: false,
      message: passwordUpdate.message,
    });
  }

  if (passwordUpdate.success === false) {
    return res.status(400).json({
      success: false,
      message: passwordUpdate.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Password updated',
  });
});

userApi.use('/*fallback', (req, res) => {
  res.send('requested route does not exist in /user/');
});

// userRouter.get("/:userId/", getUser);
/*
* Gets the profile information of the user - we are searching
* by userId because this is an internal api where we have the userId
*/
