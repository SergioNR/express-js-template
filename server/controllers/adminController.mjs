import {
  deleteUserInDb,
  findUsersInDb,
  getUserById,
} from '../models/userModel.mjs';

export const getAllUsers = async (req, res) => {
  const query = await findUsersInDb();

  res.status(200).json({
    success: true,
    userCount: query.length,
    users: query,
  });
};

export const getOneUserById = async (req, res) => {
  const { userId } = req.params;

  const queryResult = await getUserById(userId);

  if (queryResult && queryResult?.success === false) { // This means there has been an error
    return res.status(502).json({
      success: false,
      errorMessage: queryResult.message,
    });
  }

  if (queryResult === null) {
    return res.status(400).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    user: queryResult,
  });
};

export const deleteOneUserById = async (req, res) => {
  const { userId } = req.params;

  // No point in checking if the user exists, since it will autofail it no user is deleted

  const deletedUser = await deleteUserInDb(userId);

  if (deletedUser && deletedUser.success === false) {
    return res.status(502).json({
      success: false,
      message: deletedUser.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'user successfully deleted',
    userId: deletedUser.user.id,
  });
};

// TODO - Define which properties should the admin be able to edit on the user - Commented for now
// export const updateUser = async (req, res) => {
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
