import { Router } from "express";
import { registerUser } from "../controllers/userController.mjs";
import { authenticationChecker } from "../middlewares/isAuthenticated.mjs";

export const userRouter = Router();

// userRouter.use(authenticationChecker)

userRouter.post(`/register/`, registerUser);


userRouter.get(`/`, authenticationChecker, (req, res) => {

   

    res.render(`userDashboard.ejs`, { user: req.user, title: `User Dashboard`, description: `User Dashboard` }); 
    //  TODO fix  https://app.clickup.com/t/86976m58a
});

userRouter.get("/*fallback", (req, res) => {
    res.status(404).send(`requested API Route does not exist in the userRouter`);
});