import { posthogUserSignedUp } from "../models/posthogModel.mjs";
import { User } from "../utils/classes/User.mjs";
import { createUserInDB, getUserByEmail } from "../models/userModel.mjs";
import { validateEmail } from "../utils/validators/emailValidation.mjs";


export const registerUser = async (req, res) => {

    if (!req.body.userEmail) {
        return res.render(`register.ejs`, { message: `Please input an email address` });
    };

    if (!validateEmail(req.body.userEmail)) {
        return res.render(`register.ejs`, { message: `Please enter a valid email address` });
    };

    if (!req.body.userPassword) {
        return res.render(`register.ejs`, { message: `Please input a password` });
    };
    
    const newUser = new User(req);

    // Check if user exists in DB
    
    if (await getUserByEmail(newUser.userDetails.email)) {

        return res.render(`register.ejs`, { message: `A user with that email address already exists` });

    } else {
        const createdUser = await createUserInDB(newUser);
    
        await posthogUserSignedUp(createdUser);
    
        res.redirect("/login");
    }
    
};