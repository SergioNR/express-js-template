import {
  countUsersWithCompanyRoleInDb,
  deleteUserInDb,
  getCompanyMembersInDb,
  getOneCompanyMemberInDb,
  getUserByEmail,
  updateUserCompanyRolesInDb,
} from '../models/userModel.js';
import {
  createTeamInviteInDb,
  deleteTeamInviteInDb,
  getCompanyPendingInvitesInDb,
  getTeamInviteByCompanyAndEmailInDb,
  getTeamInviteByIdInDb,
} from '../models/teamInvitesModel.js';
import {
  getAllPermissionNames,
  getAllRolesWithPermissions,
  getUserCompanyPermissions,
  getUserCompanyRoleNames,
  getRoleByName,
} from '../models/roleModel.js';
import { getCompanyByIdInDb } from '../models/companyModel.js';
import { cleanupAfterUserDeletion } from '../utils/userDeletionCleanup.js';
import { canGrantRole, rolesGrantableBy } from '../utils/companyRoleHierarchy.js';
import { sendTeamInviteToUser } from '../integrations/brevo/transactionalEmails/sendTeamInviteToUser.js';

const COMPANY_OWNER_ROLE = 'company_owner';

const toMemberShape = (member) => ({
  id: member.id,
  email: member.email,
  role: member.role,
  created_at: member.created_at,
  companyRoles: member.UserRoles.map((userRole) => userRole.Role.name),
});

const toInviteShape = (invite, roleId) => ({
  id: invite.id,
  email: invite.email,
  role: roleId,
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
    success: true,
    message: 'Team data retrieved successfully',
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
      success: false,
      message: 'Email is already registered - the person should log in instead',
    });
  }

  const existingInvite = await getTeamInviteByCompanyAndEmailInDb(companyId, email);

  if (existingInvite) {
    return res.status(409).json({
      success: false,
      message: 'An invite is already pending for this email - resend it instead',
    });
  }

  const role = await getRoleByName(roleName);

  if (!role) {
    return res.status(404).json({
      success: false,
      message: 'Role does not exist',
    });
  }

  if (callerRole !== 'admin') {
    //* Non-superusers can only grant roles they hold themselves (directly or
    //* through the role hierarchy)
    const callerRoleNames = await getUserCompanyRoleNames(inviterId);

    if (!canGrantRole(callerRoleNames, roleName)) {
      return res.status(403).json({
        success: false,
        message: 'You can only invite users to roles you hold yourself',
      });
    }
  }

  let invite;

  try {
    invite = await createTeamInviteInDb({
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
        success: false,
        message: 'An invite is already pending for this email - resend it instead',
      });
    }

    throw error;
  }

  const company = await getCompanyByIdInDb(companyId);

  //* Fire-and-forget - the function swallows its own errors so an email
  //* provider outage never changes this response
  sendTeamInviteToUser(email, invite.id, company?.name, inviterEmail);

  return res.status(201).json({
    success: true,
    message: 'Invite sent successfully',
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
      success: false,
      message: 'Invite does not exist',
    });
  }

  const invitedUser = await getUserByEmail(invite.email);

  if (invitedUser) {
    //* The invitee registered on their own in the meantime - the invite is void
    await deleteTeamInviteInDb(inviteId, companyId);

    return res.status(409).json({
      success: false,
      message: 'Email is already registered - the invite is no longer valid',
    });
  }

  //* Re-creating rotates the token (previous link becomes unusable) and
  //* resets the expiry window
  const rotatedInvite = await createTeamInviteInDb({
    email: invite.email,
    companyId,
    roleId: invite.role_id,
    invitedBy: inviterId,
  });

  const company = await getCompanyByIdInDb(companyId);

  sendTeamInviteToUser(invite.email, rotatedInvite.id, company?.name, inviterEmail); // Fire-and-forget

  return res.status(200).json({
    success: true,
    message: 'Invite resent successfully',
    invite: toInviteShape(rotatedInvite, invite.Role.name),
  });
};

export const revokeTeamInvite = async (req, res) => {
  const { inviteId } = req.params;

  const { company_id: companyId } = req.user;

  const invite = await getTeamInviteByIdInDb(inviteId, companyId);

  if (!invite) {
    return res.status(404).json({
      success: false,
      message: 'Invite does not exist',
    });
  }

  await deleteTeamInviteInDb(inviteId, companyId);

  return res.status(200).json({
    success: true,
    message: 'Invite revoked successfully',
  });
};

export const removeTeamMember = async (req, res) => {
  const { userId } = req.params;

  const {
    company_id: companyId,
    id: callerId,
  } = req.user;

  if (userId === callerId) {
    return res.status(409).json({
      success: false,
      message: 'You cannot remove yourself - delete your account from the profile page instead',
    });
  }

  const targetMember = await getOneCompanyMemberInDb(userId, companyId);

  if (!targetMember) {
    return res.status(404).json({
      success: false,
      message: 'Member not found in your company',
    });
  }

  if (targetMember.role === 'admin') {
    return res.status(409).json({
      success: false,
      message: 'Platform admins cannot be managed from the team endpoint',
    });
  }

  const targetRoleNames = targetMember.UserRoles.map((userRole) => userRole.Role.name);

  if (targetRoleNames.includes(COMPANY_OWNER_ROLE)) {
    const ownerCount = await countUsersWithCompanyRoleInDb(COMPANY_OWNER_ROLE, companyId);

    if (ownerCount <= 1) {
      return res.status(409).json({
        success: false,
        message: 'The last company owner cannot be removed',
      });
    }
  }

  const deletedUser = await deleteUserInDb(userId);

  //* Revokes the removed member's active sessions and handles company
  //* cleanup when they were the last member
  await cleanupAfterUserDeletion(deletedUser);

  return res.status(200).json({
    success: true,
    message: 'Member removed successfully',
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
      success: false,
      message: 'You cannot change your own role',
    });
  }

  const targetMember = await getOneCompanyMemberInDb(userId, companyId);

  if (!targetMember) {
    return res.status(404).json({
      success: false,
      message: 'Member not found in your company',
    });
  }

  if (targetMember.role === 'admin') {
    return res.status(409).json({
      success: false,
      message: 'Platform admins cannot be managed from the team endpoint',
    });
  }

  const role = await getRoleByName(roleName);

  if (!role) {
    return res.status(404).json({
      success: false,
      message: 'Role does not exist',
    });
  }

  if (callerRole !== 'admin') {
    const callerRoleNames = await getUserCompanyRoleNames(callerId);

    if (!canGrantRole(callerRoleNames, roleName)) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign roles you hold yourself',
      });
    }
  }

  const targetRoleNames = targetMember.UserRoles.map((userRole) => userRole.Role.name);

  if (targetRoleNames.includes(COMPANY_OWNER_ROLE) && roleName !== COMPANY_OWNER_ROLE) {
    const ownerCount = await countUsersWithCompanyRoleInDb(COMPANY_OWNER_ROLE, companyId);

    if (ownerCount <= 1) {
      return res.status(409).json({
        success: false,
        message: 'The last company owner cannot be demoted',
      });
    }
  }

  const updatedMember = await updateUserCompanyRolesInDb(userId, role.id);

  return res.status(200).json({
    success: true,
    message: 'Member role updated successfully',
    member: toMemberShape(updatedMember),
  });
};
