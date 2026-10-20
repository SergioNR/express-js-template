import { prisma } from '../config/prismaClient.js';
import { INVITE_EXPIRY_DURATION_MS } from '../config/security.js';
import { logError } from '../config/loggerFunctions.js';

const inviteWithRelationsInclude = {
  Company: {
    select: {
      id: true,
      name: true,
    },
  },
  Role: true,
};

export const createTeamInviteInDb = async (inviteData) => {
  const {
    email,
    companyId,
    roleId,
    invitedBy,
  } = inviteData;

  //* Token rotation per company+email (mirrors createPasswordResetToken) -
  //* only the most recently generated invite link is usable
  await prisma.teamInvites.deleteMany({
    where: {
      company_id: companyId,
      email,
    },
  });

  const createTeamInviteQuery = await prisma.teamInvites.create({
    data: {
      email,
      company_id: companyId,
      role_id: roleId,
      invited_by: invitedBy,
      token_expires: new Date(Date.now() + INVITE_EXPIRY_DURATION_MS),
    },
  });

  return createTeamInviteQuery;
};

export const getTeamInviteByToken = async (inviteToken) => {
  const getTeamInviteQuery = await prisma.teamInvites.findUnique({
    where: {
      id: inviteToken,
    },
    include: inviteWithRelationsInclude,
  });

  return getTeamInviteQuery;
};

export const getTeamInviteByIdInDb = async (inviteId, companyId) => {
  //* Scoped by company so one company can never act on another's invites
  const getTeamInviteQuery = await prisma.teamInvites.findFirst({
    where: {
      id: inviteId,
      company_id: companyId,
    },
    include: {
      Role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return getTeamInviteQuery;
};

export const getTeamInviteByCompanyAndEmailInDb = async (companyId, email) => {
  const getTeamInviteQuery = await prisma.teamInvites.findUnique({
    where: {
      company_id_email: {
        company_id: companyId,
        email,
      },
    },
  });

  return getTeamInviteQuery;
};

export const getCompanyPendingInvitesInDb = async (companyId) => {
  const getCompanyInvitesQuery = await prisma.teamInvites.findMany({
    where: {
      company_id: companyId,
    },
    include: {
      Role: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return getCompanyInvitesQuery;
};

export const deleteTeamInviteInDb = async (inviteId, companyId) => {
  const deleteResult = await prisma.teamInvites.deleteMany({
    where: {
      id: inviteId,
      company_id: companyId,
    },
  });

  return deleteResult.count > 0;
};

export const deleteExpiredTeamInvites = async () => {
  const whereClause = {
    token_expires: {
      lt: new Date(),
    },
  };

  await prisma.teamInvites.deleteMany({
    where: whereClause,
  });
};

//* Non-throwing cleanup used by the invite-accept flow - a failed delete
//* must not flip an already-successful account creation into a 500
export const deleteTeamInviteByTokenSafe = async (inviteToken) => {
  try {
    await prisma.teamInvites.delete({
      where: {
        id: inviteToken,
      },
    });
  } catch (error) {
    logError(`Team invite token ${inviteToken} deletion failed`, error);
    // throw error //* NOT throwing an error since req-res
    //*  flow should not be interrupted with this cleanup operation
  }
};
