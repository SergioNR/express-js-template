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
  getAllPermissionNames,
  getAllRolesWithPermissions,
  getUserCompanyPermissions,
  getUserCompanyRoleNames,
  getRoleByName,
} from '../models/roleModel.js';
import { getCompanyByIdInDb } from '../models/companyModel.js';
import { deleteUserAndCleanup } from '../utils/userDeletionCleanup.js';
import { canGrantRole, rolesGrantableBy } from '../utils/companyRoleHierarchy.js';
import { sendTeamInviteToUser } from '../integrations/brevo/transactionalEmails/sendTeamInviteToUser.js';

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

//* The endpoint is authenticated so enumeration rules do not apply - a clear
//* 409 beats a vague generic error when inviting an already-registered email

export const getTeamData = async (req, res) => {
  const {
    company_id: companyId,
    id: userId,
    role: callerRole,
  } = req.user;

  const [companyMembers, companyInvites, allRoles] = await Promise.all([
    getCompanyMembersInDb(companyId),
    getCompanyPendingInvitesInDb(companyId),
    getAllRolesWithPermissions(),
  ]);

  const allRoleNames = allRoles.map((role) => role.name).sort();

  //* Superusers see every control (they bypass permission checks), regular
  //* members only see what their own company roles allow
  const callerPermissions = callerRole === 'admin'
    ? await getAllPermissionNames()
    : await getUserCompanyPermissions(userId);

  const assignableRoles = callerRole === 'admin'
    ? allRoleNames
    : rolesGrantableBy(await getUserCompanyRoleNames(userId));

  return res.status(200).json({
    members: companyMembers.map(toMemberShape),
    invites: companyInvites.map((invite) => toInviteShape(invite, invite.Role.name)),
    callerPermissions,
    assignableRoles,
  });
};

export const createTeamInvite = async (req, res) => {
  const { email, roleName } = req.body;

  const {
    company_id: companyId,
    email: inviterEmail,
    id: inviterId,
    role: callerRole,
  } = req.user;

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return res.status(409).json({
      message: 'Email is already registered - the person should log in instead',
    });
  }

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

  if (callerRole !== 'admin') {
    //* Non-superusers can only grant roles they hold themselves (directly or
    //* through the role hierarchy)
    const callerRoleNames = await getUserCompanyRoleNames(inviterId);

    if (!canGrantRole(callerRoleNames, roleName)) {
      return res.status(403).json({
        message: 'You can only invite users to roles you hold yourself',
      });
    }
  }

  let createdInvite;

  try {
    createdInvite = await createTeamInviteInDb({
      email,
      companyId,
      roleId: role.id,
      invitedBy: inviterId,
    });
  } catch (error) {
    //* Concurrent invites can beat the pending check - the unique
    //* company+email constraint resolves the race
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'An invite is already pending for this email - resend it instead',
      });
    }

    throw error;
  }

  const { invite, inviteToken } = createdInvite;

  const company = await getCompanyByIdInDb(companyId);

  //* Fire-and-forget - the function swallows its own errors so an email
  //* provider outage never changes this response
  sendTeamInviteToUser(invite.email, inviteToken, company?.name, inviterEmail);

  return res.status(201).json({
    invite: toInviteShape(invite, role.name),
  });
};

export const resendTeamInvite = async (req, res) => {
  const { inviteId } = req.params;

  const {
    company_id: companyId,
    email: inviterEmail,
    id: inviterId,
  } = req.user;

  const invite = await getTeamInviteByIdInDb(inviteId, companyId);

  if (!invite) {
    return res.status(404).json({
      message: 'Invite does not exist',
    });
  }

  const invitedUser = await getUserByEmail(invite.email);

  if (invitedUser) {
    //* The invitee registered on their own in the meantime - the invite is void
    await deleteTeamInviteInDb(inviteId, companyId);

    return res.status(409).json({
      message: 'Email is already registered - the invite is no longer valid',
    });
  }

  let rotation;

  try {
    //* Single atomic UPDATE - the previous link stops working, the expiry
    //* window resets and the invite id stays the same
    rotation = await rotateTeamInviteTokenInDb(inviteId, companyId, inviterId);
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

  const company = await getCompanyByIdInDb(companyId);

  sendTeamInviteToUser(rotatedInvite.email, inviteToken, company?.name, inviterEmail); // Fire-and-forget

  return res.status(200).json({
    invite: toInviteShape(rotatedInvite, invite.Role.name),
  });
};

export const revokeTeamInvite = async (req, res) => {
  const { inviteId } = req.params;

  const { company_id: companyId } = req.user;

  const invite = await getTeamInviteByIdInDb(inviteId, companyId);

  if (!invite) {
    return res.status(404).json({
      message: 'Invite does not exist',
    });
  }

  await deleteTeamInviteInDb(inviteId, companyId);

  return res.status(200).json({});
};

//* Non-superusers may only manage members whose every current role they
//* could grant themselves - an admin can never demote or remove an owner.
//* Returns the role names the caller may act on (undefined = unrestricted)
const getManageableRoleNames = async (callerId, callerRole) => {
  if (callerRole === 'admin') {
    return undefined;
  }

  return rolesGrantableBy(await getUserCompanyRoleNames(callerId));
};

const outranksCaller = (targetMember, manageableRoleNames) => {
  if (!manageableRoleNames) {
    return false;
  }

  return targetMember.UserRoles.some((userRole) => !manageableRoleNames.includes(userRole.Role.name));
};

export const removeTeamMember = async (req, res) => {
  const { userId } = req.params;

  const {
    company_id: companyId,
    id: callerId,
    role: callerRole,
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

  if (targetMember.role === 'admin') {
    return res.status(409).json({
      message: 'Platform admins cannot be managed from the team endpoint',
    });
  }

  const manageableRoleNames = await getManageableRoleNames(callerId, callerRole);

  if (outranksCaller(targetMember, manageableRoleNames)) {
    return res.status(403).json({
      message: 'You cannot remove a member whose role outranks your own',
    });
  }

  //* The rank and last-owner checks are repeated inside the transaction,
  //* under the company lock, together with the delete itself
  const deletionResult = await deleteUserAndCleanup(userId, {
    companyId,
    protectLastOwner: true,
    allowedTargetRoleNames: manageableRoleNames,
  });

  if (deletionResult.status === 'not_found') {
    return res.status(404).json({
      message: 'Member not found in your company',
    });
  }

  if (deletionResult.status === 'forbidden') {
    return res.status(403).json({
      message: 'You cannot remove a member whose role outranks your own',
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
    role: callerRole,
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

  if (targetMember.role === 'admin') {
    return res.status(409).json({
      message: 'Platform admins cannot be managed from the team endpoint',
    });
  }

  const role = await getRoleByName(roleName);

  if (!role) {
    return res.status(404).json({
      message: 'Role does not exist',
    });
  }

  const manageableRoleNames = await getManageableRoleNames(callerId, callerRole);

  if (manageableRoleNames && !manageableRoleNames.includes(roleName)) {
    return res.status(403).json({
      message: 'You can only assign roles you hold yourself',
    });
  }

  if (outranksCaller(targetMember, manageableRoleNames)) {
    return res.status(403).json({
      message: 'You cannot change the role of a member whose role outranks your own',
    });
  }

  //* The rank and last-owner checks are repeated inside the transaction,
  //* under the company lock, together with the write itself
  const updateResult = await updateCompanyMemberRoleInDb(userId, companyId, role, {
    allowedTargetRoleNames: manageableRoleNames,
  });

  if (updateResult.status === 'not_found') {
    return res.status(404).json({
      message: 'Member not found in your company',
    });
  }

  if (updateResult.status === 'forbidden') {
    return res.status(403).json({
      message: 'You cannot change the role of a member whose role outranks your own',
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
