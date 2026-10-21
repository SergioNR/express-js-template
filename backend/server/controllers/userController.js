import { getUserById } from '../models/userModel.js';
import { SESSION_COOKIE_NAME } from '../config/security.js';
import { deleteUserAndCleanup } from '../utils/userDeletionCleanup.js';

export const getUserProfile = async (req, res) => {
  const { id: userId } = req.user;

  const userProfile = await getUserById(userId);

  if (!userProfile) {
    return res.status(404).json({});
  }

  return res.status(200).json({
    user: userProfile,
  });
};

export const deleteUser = async (req, res) => {
  let deletionResult;

  try {
    //* The last company owner cannot leave while other members remain -
    //* nobody would be left to manage them. Checked under the company lock
    //* inside the deletion transaction
    deletionResult = await deleteUserAndCleanup(req.user.id, {
      protectLastOwner: true,
    });
  } catch (error) {
    //* Only the DB transaction can throw - post-commit cleanup never does,
    //* so a 409 here always means nothing was deleted
    if (error.code === 'P2003') {
      return res.status(409).json({
        message: 'User deletion failed - Related DB entries exist',
      });
    }

    throw error; //* Forwarded to the global error handler (Express 5)
  }

  if (deletionResult.status === 'not_found') {
    return res.status(404).json({});
  }

  if (deletionResult.status === 'last_owner') {
    return res.status(409).json({
      message: 'You are the last company owner - make another member an owner before deleting your account',
      code: 'USER_LAST_COMPANY_OWNER',
    });
  }

  //* Best-effort destruction of the (now revoked) current session
  return req.session.destroy(() => {
    res.clearCookie(SESSION_COOKIE_NAME);

    return res.status(200).json({});
  });
};
