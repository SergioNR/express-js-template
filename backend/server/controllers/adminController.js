import {
  deleteUserInDb,
  getAllUsersInDb,
  getUserById,
} from '../models/userModel.js';

export const getAllUsers = async (req, res) => {
  const params = req.query;

  const users = await getAllUsersInDb(params);

  return res.status(200).json({
    success: true,
    message: 'Users successfully retrieved - DB',
    userCount: users.length,
    users: users,
  });
};

export const getOneUserById = async (req, res) => {
  const { userId } = req.params;

  const getOneUserByIdQuery = await getUserById(userId);

  if (getOneUserByIdQuery === null) {
    return res.status(400).json({
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

  const existingUser = await getUserById(userId);
  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: 'User deletion failed - User does not exist',
    });
  }

  const deleteUserQuery = await deleteUserInDb(userId);

  return res.status(200).json({
    success: true,
    message: 'User successfully deleted',
    userId: deleteUserQuery.id,
  });
};
