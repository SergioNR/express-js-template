import { connectToDatabase } from "../database/mongoDB.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { logUserCreatedInDB } from "../config/loggerFunctions.mjs";


export const createUserInDB = async (user) => {
  try {
    const hashedPassword = await bcrypt.hash(user.userDetails.password, 10);
    user.userDetails.password = hashedPassword;

    const db = await connectToDatabase();

    const usersCollection = db.collection("users");

    await usersCollection.insertOne(user);

    logUserCreatedInDB(user._id, user);
    
    return user;
    
  } catch (error) {

    if (error.message === 'MongoNetworkError') {
      return { 
        success: false,
        error: 'Database connection failed',
        code: 'DB_CONNECTION_ERROR' };
    } else {
      return { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
    }

  } 
};


export const getUserByEmail = async (userEmail) => {
  try {

    const db = await connectToDatabase();

    const usersCollection = db.collection("users");

    const filter = { 
      "userDetails.email": userEmail 
    };

    const user = await usersCollection.findOne(filter);

    return user;

  } catch (error) {

    if (error.message === 'MongoNetworkError') {
      return { 
        success: false,
        error: 'Database connection failed',
        code: 'DB_CONNECTION_ERROR' };
    } else {
      return { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
    }
  }
};

export const updateLastLoginDate = async (userId) => {
  try {
    const db = await connectToDatabase();

    const usersCollection = db.collection("users");

    const filter = { 
      "_id": ObjectId.createFromHexString(`${userId}`) 
      };

    await usersCollection.updateOne(filter, {
      $set: {
        "lastLoginDate": new Date()
      }
    });

    return;

  } catch (error) {
      throw error;
  }
}

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

    const db = await connectToDatabase();

    const usersCollection = db.collection("users");

    const filter = { 
      "_id": ObjectId.createFromHexString(`${userId}`) 
      };

    const user = await usersCollection.findOne(filter);

    return user;

} 
  catch (error) {
    throw error;

  }
}; 