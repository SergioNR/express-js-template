import { client } from "../database/mongoDB.database.mjs";
import { ObjectId } from "mongodb";
import { posthogUserSignedUp } from "../config/posthog-node.mjs";

const usersDB = client.db(`users`); 
const usersCollection = usersDB.collection(`users`)

class User {
  constructor(email) {
    this.email = email || `email not defined`;
    this.role = `customer`;
    this.createdDate = new Date().toLocaleString(`es-ES`) || `no info`;
    this.lastUpdatedDate = new Date().toLocaleString(`es-ES`) || `no info`;
  }
}


export const createUserInDB = async (userEmail) => {
    try {
      
      await client.connect();

      const UserToBeInserted = new User(userEmail);

      const insertedUser = await usersCollection.insertOne(UserToBeInserted)

      posthogUserSignedUp(UserToBeInserted._id, UserToBeInserted.email);
        
      return UserToBeInserted;
      
    } catch (error) {
        throw error;
    } finally {
        await client.close();
    }
};

export const updateUserLastUpdatedDate = async (userId) => {
  try {
      await client.connect();

      const filter = { "_id": new ObjectId(`${userId}`) };

      const update = { $set: { "lastUpdatedDate": new Date().toLocaleString(`es-ES`) } };

      return await usersCollection.updateOne(filter, update);

  } catch (error) {
      console.log(`updateUserLastUpdatedDate`,error);
  } finally {
     await  client.close();
  };
};


export const getUserByEmail = async (userEmail) => {
  try {
    await client.connect();

    const filter = { "email": userEmail };

    const user = await usersCollection.findOne(filter);

    return user;

  } catch (error) {
      throw error;
  } finally {
      await client.close();
  }
};

// export const getAllUsers = async () => {
//   try {
//     await client.connect();

//     const filter = {};


//     const user = await usersCollection.find(filter).toArray();

//     return user;

// } 
//   catch (error) {
//     throw error;

//   } finally {
//       await client.close();
//   }
// }; //! Commented out because we are not using this function in the current version of the app. Possible usage would be if we wanted to display a list of users in the admin dashboard.

export const getUserByUserId = async (userId) => {
  try {
    await client.connect();

    const filter = { "_id": new ObjectId(`${userId}`) };


    const user = await usersCollection.findOne(filter);

    return user;

} 
  catch (error) {
    throw error;

  } finally {
      await client.close();
  }
}; //! Commented out because we are not using this function in the current version of the app. Possible usage would be if we wanted to display a user profile page.