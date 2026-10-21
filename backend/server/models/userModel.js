import { prisma } from '../config/prismaClient.js';
import { posthogUserDeleteAccount, posthogUserSignedUp } from './posthogModel.js';
import { FREE_TRIAL_DURATION_MS } from '../config/security.js';
import {
  logError,
  logInfo,
} from '../config/loggerFunctions.js';
import { lockCompanyForUpdateInDb } from './companyModel.js';

const COMPANY_OWNER_ROLE = 'company_owner';

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
      name: COMPANY_OWNER_ROLE,
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
    omit: {
      password: true,
    },
  });

  logInfo(`User ${createUserInDbQuery.id} (${createUserInDbQuery.role}) created in DB`, createUserInDbQuery);

  posthogUserSignedUp(createUserInDbQuery, { createdCompany: true }); // Fire-and-forget

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
    //* id tiebreaker keeps the cursor order total when created_at collides
    orderBy: [
      { created_at: 'desc' },
      { id: 'desc' },
    ],
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

const countCompanyOwnersInTx = (tx, companyId) => tx.user.count({
  where: {
    company_id: companyId,
    UserRoles: {
      some: {
        Role: {
          name: COMPANY_OWNER_ROLE,
        },
      },
    },
  },
});

//* Every DB step of a user deletion in one transaction: the user row (its
//* UserRole and reset-token rows cascade), its sessions and - when it was the
//* last member - the company's subscription, invites and company row (File
//* rows cascade). Third-party cleanup (Stripe, S3) needs data that is gone
//* after the commit, so the subscription and file keys are returned for the
//* caller to act on AFTER the transaction succeeded.
//*
//* The company row lock serializes concurrent deletions/role changes of the
//* same company, so the last-owner and last-member checks cannot race.
//*
//* Options:
//* - companyId: only delete when the user belongs to this company
//* - protectLastOwner: refuse to delete the last company owner while other
//*   members remain (they would be left without anyone able to manage them)
//* - allowedTargetRoleNames: refuse when the user holds a role outside this
//*   list (re-checks the caller's role rank inside the lock)
//*
//* Resolves to { status: 'not_found' | 'last_owner' | 'forbidden' } or
//* { status: 'deleted', deletedUser, companyDeleted, subscription, fileKeys }
export const deleteUserWithCompanyDataInDb = async (userId, options = {}) => {
  const {
    companyId,
    protectLastOwner = false,
    allowedTargetRoleNames,
  } = options;

  const deletionResult = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        id: userId,
        ...(companyId ? { company_id: companyId } : {}),
      },
      select: {
        id: true,
        company_id: true,
      },
    });

    if (!user) {
      return { status: 'not_found' };
    }

    const { company_id: userCompanyId } = user;

    await lockCompanyForUpdateInDb(tx, userCompanyId);

    //* Role rows are read after the lock so they reflect committed changes
    const userRoles = await tx.userRole.findMany({
      where: {
        user_id: userId,
      },
      select: {
        Role: {
          select: {
            name: true,
          },
        },
      },
    });

    const userRoleNames = userRoles.map((userRole) => userRole.Role.name);

    if (allowedTargetRoleNames
      && !userRoleNames.every((roleName) => allowedTargetRoleNames.includes(roleName))) {
      return { status: 'forbidden' };
    }

    if (protectLastOwner && userRoleNames.includes(COMPANY_OWNER_ROLE)) {
      const ownerCount = await countCompanyOwnersInTx(tx, userCompanyId);
      const memberCount = await tx.user.count({
        where: {
          company_id: userCompanyId,
        },
      });

      if (ownerCount <= 1 && memberCount > 1) {
        return { status: 'last_owner' };
      }
    }

    const deletedUser = await tx.user.delete({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
    });

    await tx.session.deleteMany({
      where: {
        user_id: userId,
      },
    });

    const remainingUsers = await tx.user.count({
      where: {
        company_id: userCompanyId,
      },
    });

    if (remainingUsers > 0) {
      return {
        status: 'deleted',
        deletedUser,
        companyDeleted: false,
        subscription: null,
        fileKeys: [],
      };
    }

    const subscription = await tx.subscription.findUnique({
      where: {
        company_id: userCompanyId,
      },
      select: {
        id: true,
        expires_at: true,
      },
    });

    const companyFiles = await tx.file.findMany({
      where: {
        company_id: userCompanyId,
      },
      select: {
        s3_key: true,
      },
    });

    await tx.subscription.deleteMany({
      where: {
        company_id: userCompanyId,
      },
    });

    //* Invites cascade with the company too - deleted explicitly so the
    //* company delete never depends on the FK action
    await tx.teamInvites.deleteMany({
      where: {
        company_id: userCompanyId,
      },
    });

    await tx.company.delete({
      where: {
        id: userCompanyId,
      },
    });

    return {
      status: 'deleted',
      deletedUser,
      companyDeleted: true,
      subscription,
      fileKeys: companyFiles.map((file) => file.s3_key),
    };
  });

  if (deletionResult.status === 'deleted') {
    logInfo(`User ${userId} succesfully deleted`);

    posthogUserDeleteAccount(userId); // Fire-and-forget
  }

  return deletionResult;
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

//* v1 keeps a single company role per user - the nested write replaces the
//* existing row so a member is never role-less. Runs under the company row
//* lock so the last-owner check and the write are atomic.
//*
//* Options:
//* - allowedTargetRoleNames: refuse when the member currently holds a role
//*   outside this list (re-checks the caller's role rank inside the lock)
//*
//* Resolves to { status: 'not_found' | 'last_owner' | 'forbidden' } or
//* { status: 'updated', member }
export const updateCompanyMemberRoleInDb = async (userId, companyId, role, options = {}) => {
  const { allowedTargetRoleNames } = options;

  return prisma.$transaction(async (tx) => {
    await lockCompanyForUpdateInDb(tx, companyId);

    const targetMember = await tx.user.findFirst({
      where: {
        id: userId,
        company_id: companyId,
      },
      select: {
        UserRoles: {
          select: {
            Role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!targetMember) {
      return { status: 'not_found' };
    }

    const targetRoleNames = targetMember.UserRoles.map((userRole) => userRole.Role.name);

    if (allowedTargetRoleNames
      && !targetRoleNames.every((roleName) => allowedTargetRoleNames.includes(roleName))) {
      return { status: 'forbidden' };
    }

    if (targetRoleNames.includes(COMPANY_OWNER_ROLE) && role.name !== COMPANY_OWNER_ROLE) {
      const ownerCount = await countCompanyOwnersInTx(tx, companyId);

      if (ownerCount <= 1) {
        return { status: 'last_owner' };
      }
    }

    const updatedMember = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        UserRoles: {
          deleteMany: {},
          create: {
            role_id: role.id,
          },
        },
      },
      omit: {
        password: true,
      },
      include: companyMemberInclude,
    });

    return {
      status: 'updated',
      member: updatedMember,
    };
  });
};
