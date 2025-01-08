import { Router } from "express";
import { registerUser } from "../controllers/userController.mjs";
import { authenticationChecker } from "../middlewares/isAuthenticated.mjs";
import { sanitizerResult } from "../middlewares/sanitizerResult.mjs";
import { checkSchema } from "express-validator";
import { createUserValidationSchema } from "../utils/validators/createUserSchema.mjs";

export const userRouter = Router();

userRouter.post(`/register/`, checkSchema(createUserValidationSchema), sanitizerResult, registerUser);

userRouter.get(`/`, authenticationChecker, (req, res) => {

    res.set('Cache-Control', 'no-store');
    res.render(`userDashboard.ejs`, { user: req.user, title: `User Dashboard`, description: `User Dashboard` }); 
});

userRouter.get("/*fallback", (req, res) => {
    res.status(404).send(`requested API Route does not exist in the userRouter`);
});