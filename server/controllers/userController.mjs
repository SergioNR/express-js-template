import bcrypt from 'bcryptjs';
import { User } from '../utils/classes/User.mjs';
import { createUserInDB, getUserByEmail, deleteUserInDb } from '../models/userModel.mjs';

export const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const deleteUser = async (req, res) => {
  try {
    const deletionRequest = await deleteUserInDb(req.user.id);

    if (deletionRequest && deletionRequest.success === false) {
      return res.status(500).json({
        success: false,
        message: deletionRequest.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
    });
  }
};

// export const updateUserPassword = async (req, res) => {
//   if (req.sanitizedErrors) {
//     return res.status(400).json({
//       success: false,
//       message: req.sanitizedErrors,
//     });
//   }
//   const {
//     currentPassword,
//     newPassword,
//   } = req.body;

//   const userId = req.user.id;
//   const user = await getUserById(userId);

//   if (user === null) {
//     return res.status(401).json({
//       success: false,
//       message: 'User not found',
//     });
//   }

//   try {
//     const storedPasswordHash = user.password;

//     // Hash the new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Compare current password with stored hash
//     const isMatch = await bcrypt.compare(currentPassword, storedPasswordHash);

//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         ERR_CODE: 'INCORRECT_PASSWORD',
//         message: 'Current password is incorrect',
//       });
//     }

//     // Update password in database
//     const updatedUser = await updateUserPasswordInDB(userId, hashedPassword);

//     if (updatedUser.success === false) {
//       return res.status(500).json({
//         success: false,
//         message: 'Error updating password',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Password updated successfully',
//       userId: updatedUser.id,
//     });
//   } catch (error) {
//     return {
//       success: false,
//       message: 'Error updating password',
//     };
//   }
// };

// export const deleteAccount = async (req, res) => {
//   // TODO - Add authorization middleware

//   const { userId } = req.params;

//   // No point in worrying if the user exists, since it will autofail it no user is deleted

//   const deletedUser = await deleteUserInDb(userId);

//   if (deletedUser && deletedUser.success === false) {
//     return res.status(502).json({
//       success: false,
//       message: deletedUser.message,
//     });
//   }

//   return res.status(200).json({
//     success: true,
//     message: 'user successfully deleted',
//     userId: deletedUser.user.id,
//   });
// };

export const createUser = async (req, res) => {
  if (req.sanitizedErrors) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId',
      errors: req.sanitizedErrors,
    });
  }
  const userData = {
    username: req.body.username,
    password: await bcrypt.hash(req.body.password, 10),
  };

  const existingUser = await getUserByEmail(userData.username);

  if (existingUser && existingUser.success === false) {
    return res.status(500).json({
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes', //* Error generated on getUserByEmail() error
    });
  }

  if (existingUser !== null) {
    return res.status(400).json({
      success: false,
      ERR_CODE: 'USER_ALREADY_EXISTS',
      message: 'A user with that email address already exists',
    });
  }

  const createdUser = await createUserInDB(new User(userData));

  if (createdUser.success === false) {
    return res.status(300).json({
      success: false,
      ERR_CODE: 'USER_CREATION_ERROR',
      message: 'An error occurred while creating the user - Please try again in a few minutes', //* Error generated on createUserInDB() error
    });
  }

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    userId: createdUser.id,
  });
};

export const updateUserPassword = async (req, res) => {
  
};
