import { Router } from 'express';
import { checkSchema } from 'express-validator';
import {
  registerUser,
  updateUserPassword,
  checkSession,
  requestPasswordResetToken,
  loginLocal,
  checkPasswordResetTokenValidity,
  updateRecoveredUserPassword,
  logoutUser,
  checkTeamInviteValidity,
  acceptTeamInvite,
} from '../../../controllers/authController.js';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.js';
import { authLimiter } from '../../../middlewares/authRateLimiter.js';
import { createUserValidationSchema } from '../../../utils/validators/createUserSchema.js';
import { userLoginValidationSchema } from '../../../utils/validators/userLoginValidationSchema.js';

import { updatePasswordSchema } from '../../../utils/validators/updatePasswordSchema.js';
import { recoverPasswordSchema } from '../../../utils/validators/recoverPasswordSchema.js';
import { checkAuthentication } from '../../../middlewares/authenticationChecker.js';
import { requestNewPasswordSchema } from '../../../utils/validators/requestNewPasswordSchema.js';
import { passwordResetTokenQuerySchema } from '../../../utils/validators/passwordResetTokenQuerySchema.js';
import { teamInviteTokenQuerySchema } from '../../../utils/validators/teamInviteTokenQuerySchema.js';
import { acceptTeamInviteSchema } from '../../../utils/validators/acceptTeamInviteSchema.js';

export const authRouter = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: Authenticates the user with the local strategy and establishes a session cookie (`connect.sid`).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful. A session cookie is set on the client.
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
 *                       format: uuid
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *       401:
 *         description: Incorrect email or password
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
 *       429:
 *         description: Too many authentication attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
authRouter.post('/login', authLimiter, checkSchema(userLoginValidationSchema), sanitizerResult, loginLocal);

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new user (always with the `user` role) and its company. Responds with the same 201 shape whether or not the email is already registered, so the endpoint cannot be used to enumerate accounts.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully (or the email is already registered - the response is identical)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       429:
 *         description: Too many authentication attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
authRouter.post('/register', authLimiter, checkSchema(createUserValidationSchema), sanitizerResult, registerUser);

/**
 * @openapi
 * /api/v1/auth/password-reset:
 *   get:
 *     tags: [Auth]
 *     summary: Check password reset token validity
 *     description: Retrieves the data of a password reset token and whether it is still valid.
 *     parameters:
 *       - in: query
 *         name: passwordResetToken
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Token exists and is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Token is missing from the query string, is not a valid UUID or has expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: Token does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
authRouter.get('/password-reset', checkSchema(passwordResetTokenQuerySchema), sanitizerResult, checkPasswordResetTokenValidity);

/**
 * @openapi
 * /api/v1/auth/password-reset:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset token by email
 *     description: Sends a password reset link to the given email if the user exists. The response is identical either way to prevent user enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Reset link will be sent if the email exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       429:
 *         description: Too many authentication attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
authRouter.post('/password-reset', authLimiter, checkSchema(requestNewPasswordSchema), sanitizerResult, requestPasswordResetToken);

/**
 * @openapi
 * /api/v1/auth/password-reset:
 *   patch:
 *     tags: [Auth]
 *     summary: Update password using a reset token
 *     description: Sets a new password for the user owning a valid, non-expired password reset token, deletes all of that user's reset tokens and revokes all of that user's active sessions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecoverPasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Token expired or passwords do not match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: Token does not exist
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
authRouter.patch('/password-reset', checkSchema(recoverPasswordSchema), sanitizerResult, updateRecoveredUserPassword);

/**
 * @openapi
 * /api/v1/auth/invite:
 *   get:
 *     tags: [Auth]
 *     summary: Check team invite token validity
 *     description: Retrieves the data of a team invite (invited email, company name and offered role) and whether it is still valid. Invite links are single-use per company and email and expire after 7 days.
 *     parameters:
 *       - in: query
 *         name: inviteToken
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invite exists and is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 email:
 *                   type: string
 *                   format: email
 *                 companyName:
 *                   type: string
 *                   nullable: true
 *                 roleName:
 *                   type: string
 *       400:
 *         description: Token is missing from the query string, is not a valid UUID or has expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: Token does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
authRouter.get('/invite', checkSchema(teamInviteTokenQuerySchema), sanitizerResult, checkTeamInviteValidity);

/**
 * @openapi
 * /api/v1/auth/invite-accept:
 *   post:
 *     tags: [Auth]
 *     summary: Accept a team invite and create the account
 *     description: Validates the invite token, creates the user in the invited company with the invited company role and the global `user` role, and deletes the invite. No session is established - the new member logs in afterwards.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcceptInviteRequest'
 *     responses:
 *       201:
 *         description: Account created successfully - the user can now log in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Token is not a valid UUID or has expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: Token does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: The invited email became registered in the meantime - the invite was revoked
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
 *       429:
 *         description: Too many authentication attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
authRouter.post('/invite-accept', authLimiter, checkSchema(acceptTeamInviteSchema), sanitizerResult, acceptTeamInvite);

authRouter.use(checkAuthentication());

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current user
 *     description: Destroys the current session and clears the session cookie on the client.
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: User is not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
authRouter.post('/logout', logoutUser);

/**
 * @openapi
 * /api/v1/auth/update-user-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Update the password of the logged-in user
 *     description: Validates the current password before setting the new one.
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 success:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Current password is incorrect, or the new password is the same as the current one - disambiguated by `code`
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorMessage'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       enum: [Current password is incorrect, New password must be different from the current password]
 *                     code:
 *                       type: string
 *                       enum: [AUTH_CURRENT_PASSWORD_INCORRECT, AUTH_PASSWORD_UNCHANGED]
 *                       description: Machine-readable reason distinguishing the two 400 cases
 *       404:
 *         description: User not found
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
authRouter.patch('/update-user-password', checkSchema(updatePasswordSchema), sanitizerResult, updateUserPassword);

/**
 * @openapi
 * /api/v1/auth/session:
 *   get:
 *     tags: [Auth]
 *     summary: Check whether the current session is valid
 *     description: Returns the logged-in user id when the session cookie is valid.
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Session is valid
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
 *                       format: uuid
 *       401:
 *         description: Session is invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
authRouter.get('/session', checkSession);

authRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
