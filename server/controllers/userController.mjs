import { posthogUserSignedUp } from "../models/posthogModel.mjs";
import asyncHandler from "express-async-handler";
import { User } from "../utils/classes/User.mjs";
import { createUserInDB, getUserByEmail } from "../models/userModel.mjs";


export const registerUser = asyncHandler(async (req, res) => {

    const newUser = new User(req);

    // Check if user exists in DB

    console.log(`getUserByEmail(newUser.userDetails.email)`, getUserByEmail(newUser.userDetails.email))
    
    if (await getUserByEmail(newUser.userDetails.email)) {

        return res.status(400).send("User already exists");

    } else {
        const createdUser = await createUserInDB(newUser);
    
        await posthogUserSignedUp(createdUser);
    
        res.redirect("/user/");
    }
    
});