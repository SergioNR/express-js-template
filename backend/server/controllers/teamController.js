import { randomUUID } from 'node:crypto';
import {
  getCompanyMembersInDb,
  getOneCompanyMemberInDb,
  getUserByEmail,
  updateCompanyMemberRoleInDb,
} from '../models/userModel.js';
import {
  createTeamInviteInDb,
  deleteTeamInviteInDb,
  getCompanyPendingInvitesInDb,
  getTeamInviteByCompanyAndEmailInDb,
  getTeamInviteByIdInDb,
  rotateTeamInviteTokenInDb,
} from '../models/teamInvitesModel.js';
import {
  getUserCompanyPermissions,
  getUserCompanyRoleNames,
  getRoleByName,
} from '../models/roleModel.js';
import { getCompanyByIdInDb } from '../models/companyModel.js';
import { deleteUserAndCleanup } from '../utils/userDeletionCleanup.js';
import { canGrantRole, outranksAllRoles, rolesGrantableBy } from '../utils/companyRoleHierarchy.js';
import { INVITE_EXPIRY_DURATION_MS } from '../config/security.js';
import { logError, logWarn } from '../config/loggerFunctions.js';
import { sendTeamInviteToUser } from '../integrations/brevo/transactionalEmails/sendTeamInviteToUser.js';
import { sendExistingAccountNoticeToUser } from '../integrations/brevo/transactionalEmails/sendExistingAccountNoticeToUser.js';

const toMemberShape = (member) => ({
  id: member.id,
  email: member.email,
  role: member.role,
  created_at: member.created_at,
  companyRoles: member.UserRoles.map((userRole) => userRole.Role.name),
});

//* Whitelisted shape - the token digest never reaches a response and the raw
//* invite token only ever travels inside the invite email
const toInviteShape = (invite, roleName) => ({
  id: invite.id,
  email: invite.email,
  role: roleName,
  token_expires: invite.token_expires,
  created_at: invite.created_at,
});

export const getTeamData = async (req, res) => {
  const {
    company_id: companyId,
    id: userId,
  } = req.user;

  //* Callers only see the controls their own company roles allow
  const [companyMembers, companyInvites, callerPermissions, callerRoleNames] = await Promise.all([
    getCompanyMembersInDb(companyId),
    getCompanyPendingInvitesInDb(companyId),
    getUserCompanyPermissions(userId),
    getUserCompanyRoleNames(userId),
  ]);

  const assignableRoles = rolesGrantableBy(callerRoleNames);

  return res.status(200).json({
    members: companyMembers.map(toMemberShape),
    invites: companyInvites.map((invite) => toInviteShape(invite, invite.Role.name)),
    callerPermissions,
    assignableRoles,
  });
};

//* Detached from the request, like registerUser: the account lookup, the
//* invite row and the email all run after the response was sent, so neither
//* the body nor the timing of the response reveals whether the invited email
//* already has an account (the endpoint is authenticated, but any company
//* member with team.invite could otherwise enumerate the whole user base).
//* An already-registered address gets no invite - only the existing-account
//* notice, when one is configured. Swallows its own errors
const issueTeamInviteInBackground = async (inviteDraft, inviterEmail) => {
  try {
    const existingUser = await getUserByEmail(inviteDraft.email);

    if (existingUser) {
      sendExistingAccountNoticeToUser(existingUser.email); // Fire-and-forget

      return;
    }

    const { invite, inviteToken } = await createTeamInviteInDb(inviteDraft);

    const company = await getCompanyByIdInDb(invite.company_id);

    //* The function swallows its own errors so an email provider outage is
    //* only ever logged
    await sendTeamInviteToUser(invite.email, inviteToken, company?.name, inviterEmail);
  } catch (error) {
    //* A concurrent invite for the same company+email beat the pending check
    //* - the unique constraint resolves the race, nothing else to do
    if (error.code === 'P2002') {
      logWarn(`Team invite ${inviteDraft.id} lost a concurrent-creation race`, error);

      return;
    }

    logError('Background team invite creation failed', error);
  }
};

export const createTeamInvite = async (req, res) => {
  const { email, roleName } = req.body;

  const {
    company_id: companyId,
    email: inviterEmail,
    id: inviterId,
  } = req.user;

  //* Every check that can change the response is company-scoped or about the
  //* caller - nothing below depends on the invited account existing
  const existingInvite = await getTeamInviteByCompanyAndEmailInDb(companyId, email);

  if (existingInvite) {
    return res.status(409).json({
      message: 'An invite is already pending for this email - resend it instead',
    });
  }

  const role = await getRoleByName(roleName);

  if (!role) {
    return res.status(404).json({
      message: 'Role does not exist',
    });
  }

  //* Callers can only grant roles they hold themselves (directly or through
  //* the role hierarchy)
  const callerRoleNames = await getUserCompanyRoleNames(inviterId);

  if (!canGrantRole(callerRoleNames, roleName)) {
    return res.status(403).json({
      message: 'You can only invite users to roles you hold yourself',
    });
  }

  //* The public handle and expiry are fixed up front so the response is
  //* identical whether or not a row gets created in the background
  const inviteDraft = {
    id: randomUUID(),
    email,
    companyId,
    roleId: role.id,
    invitedBy: inviterId,
    tokenExpires: new Date(Date.now() + INVITE_EXPIRY_DURATION_MS),
  };

  issueTeamInviteInBackground(inviteDraft, inviterEmail); // Fire-and-forget

  return res.status(201).json({
    invite: toInviteShape({
      id: inviteDraft.id,
      email: inviteDraft.email,
      token_expires: inviteDraft.tokenExpires,
      created_at: new Date(),
    }, role.name),
  });
};

//* Detached from the request: whether the invitee registered on their own in
//* the meantime decides between emailing the rotated link and voiding the
//* invite, but never changes the response. Swallows its own errors
const deliverRotatedInviteInBackground = async (rotatedInvite, inviteToken, companyId, inviterEmail) => {
  try {
    const invitedUser = await getUserByEmail(rotatedInvite.email);

    if (invitedUser) {
      //* The invitee registered on their own in the meantime - the invite is void
      await deleteTeamInviteInDb(rotatedInvite.id, companyId);

      return;
    }

    const company = await getCompanyByIdInDb(companyId);

    await sendTeamInviteToUser(rotatedInvite.email, inviteToken, company?.name, inviterEmail);
  } catch (error) {
    logError('Background team invite delivery failed', error);
  }
};

export const resendTeamInvite = async (req, res) => {
  const { inviteId } = req.params;

  const {
    company_id: companyId,
    email: inviterEmail,
    id: callerId,
  } = req.user;

  const invite = await getTeamInviteByIdInDb(inviteId, companyId);

  if (!invite) {
    return res.status(404).json({
      message: 'Invite does not exist',
    });
  }

  //* Resending re-issues the invite's role, so the caller must be able to
  //* grant it - an admin cannot keep an owner invite alive
  const callerRoleNames = await getUserCompanyRoleNames(callerId);

  if (!canGrantRole(callerRoleNames, invite.Role.name)) {
    return res.status(403).json({
      message: 'You can only resend invites to roles you hold yourself',
    });
  }

  let rotation;

  try {
    //* Single atomic UPDATE - the previous link stops working, the expiry
    //* window resets and the invite id (and original inviter) stay the same
    rotation = await rotateTeamInviteTokenInDb(inviteId, companyId);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'The invite could not be rotated - please try again',
      });
    }

    throw error;
  }

  if (!rotation) {
    //* Revoked or accepted between the lookup and the rotation
    return res.status(404).json({
      message: 'Invite does not exist',
    });
  }

  const { invite: rotatedInvite, inviteToken } = rotation;

  deliverRotatedInviteInBackground(rotatedInvite, inviteToken, companyId, inviterEmail); // Fire-and-forget

  return res.status(200).json({
    invite: toInviteShape(rotatedInvite, invite.Role.name),
  });
};

export const revokeTeamInvite = async (req, res) => {
  const { inviteId } = req.params;

  const {
    company_id: companyId,
    id: callerId,
  } = req.user;

  const invite = await getTeamInviteByIdInDb(inviteId, companyId);

  if (!invite) {
    return res.status(404).json({
      message: 'Invite does not exist',
    });
  }

  //* Same rank rule as creating the invite: nobody revokes invites to roles
  //* above their own
  const callerRoleNames = await getUserCompanyRoleNames(callerId);

  if (!canGrantRole(callerRoleNames, invite.Role.name)) {
    return res.status(403).json({
      message: 'You can only revoke invites to roles you hold yourself',
    });
  }

  await deleteTeamInviteInDb(inviteId, companyId);

  return res.status(200).json({});
};

//* Callers may only manage members they outrank - every role the target
//* holds must rank strictly below the caller's own, so an admin can never
//* demote or remove an owner nor another admin. This pre-check only answers
//* early; the model repeats it under the company lock with fresh role rows
const targetRoleNames = (targetMember) => targetMember.UserRoles.map((userRole) => userRole.Role.name);

export const removeTeamMember = async (req, res) => {
  const { userId } = req.params;

  const {
    company_id: companyId,
    id: callerId,
  } = req.user;

  if (userId === callerId) {
    return res.status(409).json({
      message: 'You cannot remove yourself - delete your account from the profile page instead',
    });
  }

  const targetMember = await getOneCompanyMemberInDb(userId, companyId);

  if (!targetMember) {
    return res.status(404).json({
      message: 'Member not found in your company',
    });
  }

  const callerRoleNames = await getUserCompanyRoleNames(callerId);

  if (!outranksAllRoles(callerRoleNames, targetRoleNames(targetMember))) {
    return res.status(403).json({
      message: 'You can only remove members whose every role ranks below your own',
    });
  }

  //* The rank and last-owner checks are repeated inside the transaction,
  //* under the company lock, together with the delete itself
  const deletionResult = await deleteUserAndCleanup(userId, {
    companyId,
    protectLastOwner: true,
    callerId,
  });

  if (deletionResult.status === 'not_found') {
    return res.status(404).json({
      message: 'Member not found in your company',
    });
  }

  if (deletionResult.status === 'forbidden') {
    return res.status(403).json({
      message: 'You can only remove members whose every role ranks below your own',
    });
  }

  if (deletionResult.status === 'last_owner') {
    return res.status(409).json({
      message: 'The last company owner cannot be removed',
    });
  }

  return res.status(200).json({
    userId,
  });
};

export const updateTeamMemberRole = async (req, res) => {
  const { userId } = req.params;
  const { roleName } = req.body;

  const {
    company_id: companyId,
    id: callerId,
  } = req.user;

  if (userId === callerId) {
    return res.status(409).json({
      message: 'You cannot change your own role',
    });
  }

  const targetMember = await getOneCompanyMemberInDb(userId, companyId);

  if (!targetMember) {
    return res.status(404).json({
      message: 'Member not found in your company',
    });
  }

  const role = await getRoleByName(roleName);

  if (!role) {
    return res.status(404).json({
      message: 'Role does not exist',
    });
  }

  const callerRoleNames = await getUserCompanyRoleNames(callerId);

  //* Granting is "at or below own rank", managing the current holder is
  //* "strictly below" - both must hold
  if (!canGrantRole(callerRoleNames, roleName)) {
    return res.status(403).json({
      message: 'You can only assign roles you hold yourself',
    });
  }

  if (!outranksAllRoles(callerRoleNames, targetRoleNames(targetMember))) {
    return res.status(403).json({
      message: 'You can only change the role of members whose every role ranks below your own',
    });
  }

  //* The rank and last-owner checks are repeated inside the transaction,
  //* under the company lock, together with the write itself
  const updateResult = await updateCompanyMemberRoleInDb(userId, companyId, role, {
    callerId,
  });

  if (updateResult.status === 'not_found') {
    return res.status(404).json({
      message: 'Member not found in your company',
    });
  }

  if (updateResult.status === 'forbidden') {
    return res.status(403).json({
      message: 'You can only change the role of members whose every role ranks below your own',
    });
  }

  if (updateResult.status === 'last_owner') {
    return res.status(409).json({
      message: 'The last company owner cannot be demoted',
    });
  }

  return res.status(200).json({
    member: toMemberShape(updateResult.member),
  });
};
