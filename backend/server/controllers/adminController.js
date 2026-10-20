import {
  deleteUserInDb,
  getAllUsersInDb,
  countUsersInDb,
  getUserById,
} from '../models/userModel.js';
import { cleanupAfterUserDeletion } from '../utils/userDeletionCleanup.js';

const ALLOWED_ROLES = ['user', 'admin'];
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export const getAllUsers = async (req, res) => {
  const filters = {};

  //* Whitelist the supported filter - any other query parameter is ignored
  //* instead of being passed through to the database
  const { role } = req.query;

  if (role) {
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(422).json({
        success: false,
        message: `Role filter must be one of: ${ALLOWED_ROLES.join(', ')}`,
      });
    }

    filters.role = role;
  }

  const limit = Math.min(Number.parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const cursor = typeof req.query.cursor === 'string' && req.query.cursor.length > 0
    ? req.query.cursor
    : undefined;

  const users = await getAllUsersInDb(filters, { limit, cursor });

  const nextCursor = users.length === limit && users.length > 0
    ? users[users.length - 1].id
    : undefined;

  const totalUserCount = await countUsersInDb(filters);

  return res.status(200).json({
    success: true,
    message: 'Users successfully retrieved - DB',
    userCount: totalUserCount,
    users: users,
    nextCursor: nextCursor,
  });
};

export const getOneUserById = async (req, res) => {
  const { userId } = req.params;

  const getOneUserByIdQuery = await getUserById(userId);

  if (getOneUserByIdQuery === null) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'User successfully retrieved - DB',
    user: getOneUserByIdQuery,
  });
};

export const deleteOneUserById = async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    return res.status(409).json({
      success: false,
      message: 'Admins cannot delete their own account from the admin endpoint - use the user endpoint instead',
    });
  }

  try {
    const existingUser = await getUserById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User deletion failed - User does not exist',
      });
    }

    const deletedUser = await deleteUserInDb(userId);

    await cleanupAfterUserDeletion(deletedUser);

    return res.status(200).json({
      success: true,
      message: 'User successfully deleted',
      userId: deletedUser.id,
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
