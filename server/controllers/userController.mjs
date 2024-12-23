import { posthogUserSignedUp } from "../models/posthogModel.mjs";
import asyncHandler from "express-async-handler";
import { User } from "../utils/classes/User.mjs";
import { createUserInDB, getUserByEmail } from "../models/userModel.mjs";
import { validateEmail } from "../utils/validators/emailValidation.mjs";


export const registerUser = asyncHandler(async (req, res) => {

    if (!req.body.userEmail) {
        return res.status(400).send("Email is required");
    };

    if (!validateEmail(req.body.userEmail)) {
        return res.status(400).send("Please enter a valid email address");
    };

    if (!req.body.userPassword) {
        return res.status(400).send("Password is required");
    };
    
    const newUser = new User(req);

    // Check if user exists in DB
    
    if (await getUserByEmail(newUser.userDetails.email)) {

        return res.status(400).send("User already exists");

    } else {
        const createdUser = await createUserInDB(newUser);
    
        await posthogUserSignedUp(createdUser);
    
        res.redirect("/user/");
    }
    
});