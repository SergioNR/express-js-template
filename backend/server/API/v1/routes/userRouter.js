import { Router } from 'express';
import { getUserProfile, deleteUser } from '../../../controllers/userController.js';

export const userRouter = Router();

/**
 * @openapi
 * /api/v1/user:
 *   get:
 *     tags: [User]
 *     summary: Get the profile of the logged-in user
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                     company_id:
 *                       type: string
 *                       format: uuid
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     last_updated_at:
 *                       type: string
 *                       format: date-time
 *                     last_login_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
userRouter.get('/', getUserProfile);

/**
 * @openapi
 * /api/v1/user:
 *   delete:
 *     tags: [User]
 *     summary: Delete the logged-in user account
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: User deletion failed - related DB entries exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       500:
 *         description: User deletion failed - please try again later
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
userRouter.delete('/', deleteUser);

userRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
