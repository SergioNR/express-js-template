import { Router } from 'express';
import {
  deleteOneUserById,
  getAllUsers,
  getOneUserById,
} from '../../../controllers/adminController.js';
import { checkPermissionByRole } from '../../../middlewares/permissionByRoleChecker.js';

export const adminRouter = Router();

adminRouter.use(checkPermissionByRole('admin'));

/**
 * @openapi
 * /api/v1/admin:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (admin only)
 *     description: Returns every user in the database. Requires an authenticated session with the `admin` role.
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userCount:
 *                   type: integer
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authenticated or missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
adminRouter.get('/', getAllUsers);

/**
 * @openapi
 * /api/v1/admin/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a single user by id (admin only)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Id of the user to retrieve
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       401:
 *         description: Not authenticated or missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
adminRouter.get('/:userId', getOneUserById);

/**
 * @openapi
 * /api/v1/admin/{userId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user by id (admin only)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Id of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *       401:
 *         description: Not authenticated or missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: User does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
adminRouter.delete('/:userId', deleteOneUserById);

adminRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
