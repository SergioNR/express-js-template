import { Router } from "express";


export const userRouter = Router();


userRouter.get(`/`, (req, res) => {
    res.render(`userDashboard.ejs`, { user: req.user });
});

userRouter.get("*", (req, res) => {
    res.status(404).send(`requested API Route does not exist in the userRouter`);
    });