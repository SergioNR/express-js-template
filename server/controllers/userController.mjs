import { posthogUserSignedUp } from "../models/posthogModel.mjs";
import asyncHandler from "express-async-handler";
import { User } from "../utils/classes/User.mjs";
import { createUserInDB } from "../models/userModel.mjs";




export const registerUser = asyncHandler(async (req, res) => {

    const newUser = new User(req);

    const createdUser = await createUserInDB(newUser);

    console.log(createdUser)

    await posthogUserSignedUp(createdUser);

    res.send(`User Created`);


});