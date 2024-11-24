import { Router } from "express";
import { registerUser } from "../controllers/userController.mjs";

export const userRouter = Router();



userRouter.post(`/signup/`, registerUser);




userRouter.get(`/`, (req, res) => {
    res.render(`userDashboard.ejs`, { user: req.user });
});

userRouter.get("/*fallback", (req, res) => {
    res.status(404).send(`requested API Route does not exist in the userRouter`);
    });