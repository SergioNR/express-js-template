import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../database/mongoDB.mjs';
import {
  logUserCreatedInDB,
  logError,
} from '../config/loggerFunctions.mjs';
import { posthogUserSignedUp } from './posthogModel.mjs';

export const createUserInDB = async (user) => {
  try {
    const hashedPassword = await bcrypt.hash(user.userDetails.password, 10);

    const updatedUser = {
      ...user,
      userDetails: {
        ...user.userDetails,
        password: hashedPassword,
      },
    };

    const db = await connectToDatabase();

    const usersCollection = db.collection('users');

    await usersCollection.insertOne(updatedUser);

    logUserCreatedInDB(updatedUser._id, updatedUser);

    posthogUserSignedUp(updatedUser);

    return user;
  } catch (error) {
    logError('Error creating user in DB', error);

    return {
      success: false,
    };
  }
};

export const getUserByEmail = async (userEmail) => {
  try {
    const db = await connectToDatabase();

    const usersCollection = db.collection('users');

    const filter = {
      'userDetails.email': userEmail,
    };

    const user = await usersCollection.findOne(filter);

    return user;
  } catch (error) {
    logError('Error getting user by email', error);

    return {
      success: false,
    };
  }
};

export const updateLastLoginDate = async (userId) => {
  try {
    const db = await connectToDatabase();

    const usersCollection = db.collection('users');

    const filter = {
      _id: ObjectId.createFromHexString(`${userId}`),
    };

    return await usersCollection.updateOne(filter, {
      $set: {
        lastLoginDate: new Date(),
      },
    });
  } catch (error) {
    logError('Error updating last login date', error);

    return {
      success: false,
    };
  }
};

export const getUserByUserId = async (userId) => {
  try {
    const db = await connectToDatabase();

    const usersCollection = db.collection('users');

    const filter = {
      _id: ObjectId.createFromHexString(`${userId}`),
    };

    const user = await usersCollection.findOne(filter);

    return user;
  } catch (error) {
    logError('Error getting user by user ID', error);

    throw error;
  }
};
