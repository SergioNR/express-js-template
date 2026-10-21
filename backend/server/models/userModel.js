import { prisma } from '../config/prismaClient.js';
import { posthogUserDeleteAccount, posthogUserSignedUp } from './posthogModel.js';
import { FREE_TRIAL_DURATION_MS } from '../config/security.js';
import {
  logError,
  logInfo,
} from '../config/loggerFunctions.js';

export const createUserInDB = async (userData) => {
  const {
    username,
    password,
    companyId,
    roleId,
    inviteId,
  } = userData;

  //* Invite acceptance path: the user joins an existing company with the
  //* invited role - no nested company/subscription creation, no trial.
  //* The invite is consumed in the same transaction so a link can never
  //* create an account and stay usable
  if (companyId && roleId) {
    const [invitedUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: username,
          password,
          role: 'user',
          company_id: companyId,
          UserRoles: {
            create: {
              role_id: roleId,
            },
          },
        },
        omit: {
          password: true,
        },
      }),
      prisma.teamInvites.deleteMany({
        where: {
          id: inviteId,
        },
      }),
    ]);

    logInfo(`User ${invitedUser.id} (${invitedUser.role}) created in DB via team invite`, invitedUser);

    posthogUserSignedUp(invitedUser); // Fire-and-forget

    return invitedUser;
  }

  //* Self-registration path: creates a brand-new company with a trial
  //* subscription, and the registrant becomes its company owner
  const ownerRole = await prisma.role.findUnique({
    where: {
      name: 'company_owner',
    },
  });

  const createUserInDbQuery = await prisma.user.create({
    data: {
      email: username,
      password: password,
      role: 'user',
      Company: {
        create: {
          Subscription: {
            create: {
              expires_at: new Date(Date.now() + FREE_TRIAL_DURATION_MS),
            },
          },
        },
      },
      UserRoles: {
        create: {
          role_id: ownerRole.id,
        },
      },
    },
  });

  logInfo(`User ${createUserInDbQuery.id} (${createUserInDbQuery.role}) created in DB`, createUserInDbQuery);

  posthogUserSignedUp(createUserInDbQuery); // Fire-and-forget

  return createUserInDbQuery;
};

export const getUserByEmail = async (userEmail) => {
  const whereClause = {
    email: userEmail,
  };

  const getUserByEmailQuery = await prisma.user.findUnique({
    where: whereClause,
  });

  return getUserByEmailQuery;
};

export const updateUserLastLoginDate = async (userId) => {
  try {
    const queryResult = await prisma.user.update({
      where: { id: userId },
      data: {
        last_login_at: new Date(),
      },
    });

    return queryResult;
  } catch (error) {
    return logError(`could not update last login date for userid ${userId}`, error);
  }
};

export const getUserPassword = async (userId) => {
  const whereClause = {
    id: userId,
  };

  const getUserPasswordQuery = await prisma.user.findUnique({
    where: whereClause,
    select: {
      password: true,
    },
  });

  return getUserPasswordQuery;
};

export const getUserById = async (userId) => {
  const whereClause = {
    id: userId,
  };

  const getUserByIdQuery = await prisma.user.findUnique({
    where: whereClause,
    omit: {
      password: true,
    },
  });

  return getUserByIdQuery;
};

//* Admin detail shape - the user plus its related company and subscription.
//* The Stripe customer id never leaves the model: clients only receive a
//* derived `stripeLinked` boolean
export const getUserDetailInDb = async (userId) => {
  const userDetailQuery = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
    include: {
      Company: {
        select: {
          id: true,
          name: true,
          stripe_id: true,
          Subscription: {
            select: {
              id: true,
              created_at: true,
              updated_at: true,
              expires_at: true,
            },
          },
        },
      },
    },
  });

  if (!userDetailQuery) {
    return null;
  }

  const { Company, ...user } = userDetailQuery;

  return {
    ...user,
    company: Company
      ? {
        id: Company.id,
        name: Company.name,
        stripeLinked: Boolean(Company.stripe_id),
        //* The schema models Company -> Subscription as a list with a unique
        //* FK, so the include always returns an array of 0 or 1 rows
        subscription: Company.Subscription[0] ?? null,
      }
      : null,
  };
};

export const updateUserPasswordInDB = async (userId, newPassword) => {
  const updatePasswordQuery = await prisma.user.update({
    where: { id: userId },
    data: {
      password: newPassword,
    },
  });

  logInfo(`Password updated successfully for User ${userId}`);

  return updatePasswordQuery;
};

export const getAllUsersInDb = async (filters = {}, pagination = {}) => {
  const getAllUsersQuery = await prisma.user.findMany({
    where: filters,
    omit: {
      password: true,
    },
    include: {
      Company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: pagination.limit,
    skip: pagination.cursor ? 1 : undefined,
    cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
  });

  return getAllUsersQuery;
};

export const countUsersInDb = async (filters = {}) => {
  const userCount = await prisma.user.count({
    where: filters,
  });

  return userCount;
};

export const deleteUserInDb = async (userId) => {
  const deleteUserQuery = await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  logInfo(`User ${userId} succesfully deleted`);

  posthogUserDeleteAccount(userId);

  return deleteUserQuery;
};

const companyMemberInclude = {
  UserRoles: {
    include: {
      Role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
};

export const getCompanyMembersInDb = async (companyId) => {
  const getCompanyMembersQuery = await prisma.user.findMany({
    where: {
      company_id: companyId,
    },
    omit: {
      password: true,
    },
    include: companyMemberInclude,
    orderBy: {
      created_at: 'desc',
    },
  });

  return getCompanyMembersQuery;
};

export const getOneCompanyMemberInDb = async (userId, companyId) => {
  //* Scoped by company so one company can never manage another's members
  const getOneCompanyMemberQuery = await prisma.user.findFirst({
    where: {
      id: userId,
      company_id: companyId,
    },
    omit: {
      password: true,
    },
    include: companyMemberInclude,
  });

  return getOneCompanyMemberQuery;
};

export const updateUserCompanyRolesInDb = async (userId, roleId) => {
  //* v1 keeps a single company role per user - the nested write replaces the
  //* existing row atomically so a member is never role-less
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      UserRoles: {
        deleteMany: {},
        create: {
          role_id: roleId,
        },
      },
    },
    omit: {
      password: true,
    },
    include: companyMemberInclude,
  });

  return updatedUser;
};

export const countUsersWithCompanyRoleInDb = async (roleName, companyId) => {
  const userCount = await prisma.user.count({
    where: {
      company_id: companyId,
      UserRoles: {
        some: {
          Role: {
            name: roleName,
          },
        },
      },
    },
  });

  return userCount;
};
