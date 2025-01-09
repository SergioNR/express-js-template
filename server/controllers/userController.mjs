import { posthogUserSignedUp } from "../models/posthogModel.mjs";
import { User } from "../utils/classes/User.mjs";
import { createUserInDB, getUserByEmail } from "../models/userModel.mjs";
import { logErrorCreatingUserInDB, logErrorInGetUserByEmail, logUserCreatedInDB } from "../config/loggerFunctions.mjs";


export const registerUser = async (req, res) => {

    const newUser = new User(req);

    const existingUser = await getUserByEmail(newUser.userDetails.email);
    
    if (existingUser && existingUser.success === false) { // my issue is how to handle this if existingUser does not have a success property

        logErrorInGetUserByEmail(existingUser);

        return res.render(`register.ejs`, { message: `An error occurred while creating the user - Please try again in a few minutes` });

    }

    if (existingUser !== null) { // Check if user exists in DB

        return res.render(`register.ejs`, { message: `A user with that email address already exists` });

    } else {
        const createdUser = await createUserInDB(newUser);

        if (createdUser.success === false) {

            return res.render(`register.ejs`, { message: `An error occurred while creating the user - Please try again in a few minutes` });

        }
        
        logUserCreatedInDB(createdUser._id, createdUser);

        await posthogUserSignedUp(createdUser);
    
        res.redirect("/login");
    }
    
};