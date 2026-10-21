import { Router } from 'express';
import { checkSchema, param } from 'express-validator';
import {
  createTeamInvite,
  getTeamData,
  removeTeamMember,
  resendTeamInvite,
  revokeTeamInvite,
  updateTeamMemberRole,
} from '../../../controllers/teamController.js';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.js';
import { checkCompanyPermission } from '../../../middlewares/companyPermissionChecker.js';
import { createTeamInviteSchema } from '../../../utils/validators/createTeamInviteSchema.js';
import { updateMemberRoleSchema } from '../../../utils/validators/updateMemberRoleSchema.js';

export const teamRouter = Router();

//* Authentication happens at the apiRouter mounting level; each route adds
//* its own company permission requirement on top

const inviteIdParamValidation = [
  param('inviteId').isUUID().withMessage('Invite id must be a valid UUID'),
  sanitizerResult,
];

const userIdParamValidation = [
  param('userId').isUUID().withMessage('User id must be a valid UUID'),
  sanitizerResult,
];

const createInviteValidation = [
  checkSchema(createTeamInviteSchema),
  sanitizerResult,
];

const updateMemberRoleValidation = [
  checkSchema(updateMemberRoleSchema),
  sanitizerResult,
];

/**
 * @openapi
 * /api/v1/team:
 *   get:
 *     tags: [Team]
 *     summary: Get the members and pending invites of the caller's company
 *     description: Returns the company members (with their company roles), the pending invites, the caller's effective permissions and the roles the caller can assign. Requires the `team.view` company permission.
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Team data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       email:
 *                         type: string
 *                         format: email
 *                       role:
 *                         type: string
 *                         enum: [user, superadmin]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       companyRoles:
 *                         type: array
 *                         items:
 *                           type: string
 *                 invites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       email:
 *                         type: string
 *                         format: email
 *                       role:
 *                         type: string
 *                       token_expires:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 callerPermissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 assignableRoles:
 *                   type: array
 *                   items:
 *                     type: string
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
teamRouter.get('/', checkCompanyPermission('team.view'), getTeamData);

/**
 * @openapi
 * /api/v1/team/invites:
 *   post:
 *     tags: [Team]
 *     summary: Invite a new member to the caller's company by email
 *     description: Creates a team invite (valid for 7 days) and emails the invite link. The secret invite token only travels inside the email - it is never part of any API response (only its sha256 digest is stored); `id` is the public handle for resend/revoke. Requires the `team.invite` company permission; the inviter must hold the invited role themselves. The endpoint is authenticated, so a registered email is answered with an explicit 409.
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeamInviteRequest'
 *     responses:
 *       201:
 *         description: Invite created and email will be sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invite:
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
 *                     token_expires:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions, or the inviter does not hold the invited role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: Role does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: Email already registered, or an invite is already pending for this email
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
teamRouter.post('/invites', checkCompanyPermission('team.invite'), createInviteValidation, createTeamInvite);

/**
 * @openapi
 * /api/v1/team/invites/{inviteId}/resend:
 *   post:
 *     tags: [Team]
 *     summary: Resend a pending invite
 *     description: Atomically rotates the secret invite token (the previous link becomes unusable), resets the 7-day expiry and re-sends the email. The invite id is unchanged and the token is never returned. Requires the `team.invite` company permission. Only invites of the caller's company can be resent.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Id of the invite to resend
 *     responses:
 *       200:
 *         description: Invite resent successfully (token rotated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invite:
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
 *                     token_expires:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
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
 *         description: Invite does not exist in the caller's company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: Email became registered in the meantime (the invite was revoked), or the token rotation collided - retry
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
teamRouter.post('/invites/:inviteId/resend', checkCompanyPermission('team.invite'), inviteIdParamValidation, resendTeamInvite);

/**
 * @openapi
 * /api/v1/team/invites/{inviteId}:
 *   delete:
 *     tags: [Team]
 *     summary: Revoke a pending invite
 *     description: Deletes a pending invite of the caller's company so its link can no longer be accepted. Requires the `team.invite` company permission.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Id of the invite to revoke
 *     responses:
 *       200:
 *         description: Invite revoked successfully
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
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: Invite does not exist in the caller's company
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
teamRouter.delete('/invites/:inviteId', checkCompanyPermission('team.invite'), inviteIdParamValidation, revokeTeamInvite);

/**
 * @openapi
 * /api/v1/team/members/{userId}:
 *   delete:
 *     tags: [Team]
 *     summary: Remove a member from the caller's company
 *     description: Deletes the member's account, revokes their active sessions and runs company cleanup when they were the last member. Requires the `team.remove` company permission; the caller must be able to grant every role the member currently holds (an admin cannot remove an owner). Self-removal, removing a superadmin and removing the last company owner are rejected with 409. The last-owner check and the deletion run atomically. Only members of the caller's company can be removed.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Id of the member to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   format: uuid
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions, or the member holds a role that outranks the caller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: Member not found in the caller's company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: Self-removal, target is a superadmin, or target is the last company owner
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
teamRouter.delete('/members/:userId', checkCompanyPermission('team.remove'), userIdParamValidation, removeTeamMember);

/**
 * @openapi
 * /api/v1/team/members/{userId}:
 *   patch:
 *     tags: [Team]
 *     summary: Change a member's company role
 *     description: Replaces the member's company role with the given one. Requires the `team.manage_roles` company permission; the caller must hold the target role themselves and be able to grant every role the member currently holds (an admin cannot demote an owner). The last-owner check and the write run atomically. Self-change, changing a superadmin's role and demoting the last company owner are rejected with 409. Only members of the caller's company can be changed.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Id of the member to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMemberRoleRequest'
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 member:
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
 *                       enum: [user, superadmin]
 *                     companyRoles:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions, the caller does not hold the target role, or the member holds a role that outranks the caller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: Member not found in the caller's company, or role does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: Self-change, target is a superadmin, or demoting the last company owner
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
teamRouter.patch('/members/:userId', checkCompanyPermission('team.manage_roles'), userIdParamValidation, updateMemberRoleValidation, updateTeamMemberRole);

teamRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
