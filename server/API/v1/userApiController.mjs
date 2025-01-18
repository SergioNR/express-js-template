import { Router } from 'express';

export const userApi = Router();

userApi.get('/', (req, res) => {
  res.status(200).json({
    message: 'This route is a work in progress',

  });
});

userApi.use('/*fallback', (req, res) => {
  res.send('requested route does not exist in /user/');
});

// userRouter.get("/:userId/", getUser); //* Gets the profile information of the user - we are searching by userId because this is an internal api where we have the userId
