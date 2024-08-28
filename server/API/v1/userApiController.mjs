import { Router } from "express";

export const userApi = Router();

// userApi.use(`*`, (req, res) => {
//     res.send(`requested API Route does not exist in the userAPI`);
// });

// userRouter.get("/:userId/", getUser); //* Gets the profile information of the user - we are searching by userId because this is an internal api where we have the userId