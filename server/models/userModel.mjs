import { connectToDatabase } from "../database/mongoDB.mjs";
import { ObjectId } from "mongodb";

import { logger } from "../config/logger.mjs";


export const createUserInDB = async (user) => {
    try {
      
      const db = await connectToDatabase();

      const usersCollection = db.collection("users");

      await usersCollection.insertOne(user)

      logger.info({
        message: `User created in DB`,
        userId: user._id,
        userData: user

      });
        
      return user;
      
    } catch (error) {
        throw error;
    } 
};

export const updateUserLastUpdatedDate = async (userId) => {
  try {

      const dbConnection = await connectToDatabase();

      const filter = { "_id": new ObjectId(`${userId}`) };

      const update = { 
        $set: { 
          "lastUpdatedDate": new Date() 
        } };

      return await usersCollection.updateOne(filter, update);

  } catch (error) {
      console.log(`updateUserLastUpdatedDate`,error);
  } 
};


export const getUserByEmail = async (userEmail) => {
  try {

    const db = await connectToDatabase();

    const filter = { "email": userEmail };

    const user = await db.findOne(filter);

    return user;

  } catch (error) {
      throw error;
  }
};

// export const getAllUsers = async () => {
//   try {


//     const filter = {};


//     const user = await usersCollection.find(filter).toArray();

//     return user;

// } 
//   catch (error) {
//     throw error;

//   } 
// }; //! Commented out because we are not using this function in the current version of the app. Possible usage would be if we wanted to display a list of users in the admin dashboard.

export const getUserByUserId = async (userId) => {
  try {

    const db = connectToDatabase();

    const filter = { 
      "_id": new ObjectId(`${userId}`) 
      };

    const user = await db.findOne(filter);

    return user;

} 
  catch (error) {
    throw error;

  }
}; 