import { Router } from 'express';
import { checkSchema, param } from 'express-validator';
import {
  deleteOneUserById,
  getAdminStats,
  getAllCompanies,
  getAllUsers,
  getOneCompanyById,
  getOneUserById,
} from '../../../controllers/adminController.js';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.js';
import { adminUserListQueryValidationSchema } from '../../../utils/validators/adminUserListQuerySchema.js';
import { adminCompanyListQueryValidationSchema } from '../../../utils/validators/adminCompanyListQuerySchema.js';

export const adminRouter = Router();

//* Role enforcement happens once, at the apiRouter mounting level

const userIdParamValidation = [
  param('userId').isUUID().withMessage('User id must be a valid UUID'),
  sanitizerResult,
];

const companyIdParamValidation = [
  param('companyId').isUUID().withMessage('Company id must be a valid UUID'),
  sanitizerResult,
];

const userListQueryValidation = [
  checkSchema(adminUserListQueryValidationSchema),
  sanitizerResult,
];

const companyListQueryValidation = [
  checkSchema(adminCompanyListQueryValidationSchema),
  sanitizerResult,
];

/**
 * @openapi
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (admin only)
 *     description: Returns the users in the database, newest first, with cursor-based pagination. Requires an authenticated session with the `admin` role.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Optional filter by role. Any other query parameter is ignored.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Optional case-insensitive partial match on the user email.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Page size.
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User id to paginate after (the `nextCursor` value of the previous page).
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
 *                 userCount:
 *                   type: integer
 *                   description: Total number of users matching the filter
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
adminRouter.get('/users', userListQueryValidation, getAllUsers);

/**
 * @openapi
 * /api/v1/admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a single user with related data (admin only)
 *     description: Returns the user plus its related company (with the Stripe customer id reduced to a `stripeLinked` boolean), the company subscription (public fields) and the count of active sessions.
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                     company_id:
 *                       type: string
 *                     company:
 *                       type: object
 *                       nullable: true
 *                     activeSessionCount:
 *                       type: integer
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
adminRouter.get('/users/:userId', userIdParamValidation, getOneUserById);

/**
 * @openapi
 * /api/v1/admin/users/{userId}:
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
 *                 userId:
 *                   type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
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
 *       409:
 *         description: Admin tried to delete their own account via the admin endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
adminRouter.delete('/users/:userId', userIdParamValidation, deleteOneUserById);

/**
 * @openapi
 * /api/v1/admin/companies:
 *   get:
 *     tags: [Admin]
 *     summary: List all companies (admin only)
 *     description: Returns the companies in the database, newest first, with cursor-based pagination, their user count and their subscription (public fields). The Stripe customer id is never exposed - only a `stripeLinked` boolean.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Optional case-insensitive partial match on the company name.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Page size.
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company id to paginate after (the `nextCursor` value of the previous page).
 *     responses:
 *       200:
 *         description: Companies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 companyCount:
 *                   type: integer
 *                   description: Total number of companies matching the filter
 *                 companies:
 *                   type: array
 *                   items:
 *                     type: object
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
adminRouter.get('/companies', companyListQueryValidation, getAllCompanies);

/**
 * @openapi
 * /api/v1/admin/companies/{companyId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a single company with related data (admin only)
 *     description: Returns the company plus its users (safe fields only) and its subscription (public fields). The Stripe customer id is never exposed - only a `stripeLinked` boolean.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Id of the company to retrieve
 *     responses:
 *       200:
 *         description: Company retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       nullable: true
 *                     stripeLinked:
 *                       type: boolean
 *                     subscription:
 *                       type: object
 *                       nullable: true
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
adminRouter.get('/companies/:companyId', companyIdParamValidation, getOneCompanyById);

/**
 * @openapi
 * /api/v1/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Platform counters for the admin overview (admin only)
 *     description: Returns aggregated counts - users (total, admins, new in the last 7 days), companies, subscriptions (total and active) and active sessions. A subscription is active when its `expires_at` is in the future.
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     totalAdmins:
 *                       type: integer
 *                     newUsersLastWeek:
 *                       type: integer
 *                     totalCompanies:
 *                       type: integer
 *                     totalSubscriptions:
 *                       type: integer
 *                     activeSubscriptions:
 *                       type: integer
 *                     activeSessions:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
adminRouter.get('/stats', getAdminStats);

adminRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
