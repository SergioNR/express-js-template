import { deleteUserInDb, getUserById } from '../models/userModel.js';
import { logError } from '../config/loggerFunctions.js';

export const getUserProfile = async (req, res) => {
  const { id: userId } = req.user;

  const userProfile = await getUserById(userId);

  if (!userProfile) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'user profile retrieved successfully - DB',
    user: userProfile,
  });
};

export const deleteUser = async (req, res) => {
  try {
    await deleteUserInDb(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logError('User deletion failed', error);

    if (error.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'User deletion failed - Related DB entries exist',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'User deletion failed - Please try again later',
    });
  }
};
