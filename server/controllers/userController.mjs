import { posthogUserSignedUp } from "../models/posthogModel.mjs";
import { User } from "../utils/classes/User.mjs";
import { createUserInDB, getUserByEmail } from "../models/userModel.mjs";


export const registerUser = async (req, res) => {

    const newUser = new User(req);
    
    if (await getUserByEmail(newUser.userDetails.email)) { // Check if user exists in DB

        return res.render(`register.ejs`, { message: `A user with that email address already exists` });

    } else {
        const createdUser = await createUserInDB(newUser);
    
        await posthogUserSignedUp(createdUser);
    
        res.redirect("/login");
    }
    
};