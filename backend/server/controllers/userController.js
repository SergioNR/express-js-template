import { deleteUserInDb, getUserById } from '../models/userModel.js';
import { SESSION_COOKIE_NAME } from '../config/security.js';
import { cleanupAfterUserDeletion } from '../utils/userDeletionCleanup.js';

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
    const deletedUser = await deleteUserInDb(req.user.id);

    await cleanupAfterUserDeletion(deletedUser);

    //* Best-effort destruction of the (now revoked) current session
    return req.session.destroy(() => {
      res.clearCookie(SESSION_COOKIE_NAME);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'User deletion failed - Related DB entries exist',
      });
    }

    throw error; //* Forwarded to the global error handler (Express 5)
  }
};
