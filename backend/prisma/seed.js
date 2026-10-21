import bcrypt from 'bcryptjs';
import { prisma } from '../server/config/prismaClient.js';
import { BCRYPT_SALT_ROUNDS, FREE_TRIAL_DURATION_MS } from '../server/config/security.js';

const ACME_COMPANY_ID = '5f8b7c2e-1d4a-4f6b-8c3a-2a1b3c4d5e6f';
const GLOBEX_COMPANY_ID = '9e7d6c5b-4a3f-4e2d-1b0a-7f8e9d0a1b2c';

//* Role ids are only used when a role row does not exist yet (same
//* deterministic UUIDs as the team_invites_rbac migration). Assignments always
//* look the role up by name, so environments seeded with other ids still work
const roles = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'company_owner',
    permissions: ['team.view', 'team.invite', 'team.remove', 'team.manage_roles', 'files.view', 'files.upload', 'files.delete', 'billing.manage'],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'company_admin',
    permissions: ['team.view', 'team.invite', 'team.remove', 'team.manage_roles', 'files.view', 'files.upload', 'files.delete'],
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'company_member',
    permissions: ['team.view', 'files.view', 'files.upload'],
  },
];

const permissions = [
  { id: '00000000-0000-4000-8000-000000000101', name: 'team.view' },
  { id: '00000000-0000-4000-8000-000000000102', name: 'team.invite' },
  { id: '00000000-0000-4000-8000-000000000103', name: 'team.remove' },
  { id: '00000000-0000-4000-8000-000000000104', name: 'team.manage_roles' },
  { id: '00000000-0000-4000-8000-000000000105', name: 'files.view' },
  { id: '00000000-0000-4000-8000-000000000106', name: 'files.upload' },
  { id: '00000000-0000-4000-8000-000000000107', name: 'files.delete' },
  { id: '00000000-0000-4000-8000-000000000108', name: 'billing.manage' },
];

const companies = [
  {
    id: ACME_COMPANY_ID,
    name: 'Acme Corp',
  },
  {
    id: GLOBEX_COMPANY_ID,
    name: 'Globex Industries',
  },
];

const users = [
  {
    email: 'admin@acme.test',
    password: 'Password123!',
    role: 'admin',
    company_id: ACME_COMPANY_ID,
  },
  {
    email: 'user@acme.test',
    password: 'Password123!',
    role: 'user',
    company_id: ACME_COMPANY_ID,
  },
  {
    email: 'admin@globex.test',
    password: 'Password123!',
    role: 'admin',
    company_id: GLOBEX_COMPANY_ID,
  },
  {
    email: 'user@globex.test',
    password: 'Password123!',
    role: 'user',
    company_id: GLOBEX_COMPANY_ID,
  },
];

//* Mirrors the migration backfill: global admins are company owners,
//* everyone else is a company member
const companyRoleNameForUser = (user) => (user.role === 'admin' ? 'company_owner' : 'company_member');

async function main() {
  const roleIdsByName = {};

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        id: role.id,
        name: role.name,
      },
    });

    roleIdsByName[role.name] = createdRole.id;

    for (const permissionName of role.permissions) {
      const permissionRecord = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: createdRole.id,
            permission_id: permissionRecord.id,
          },
        },
        update: {},
        create: {
          role_id: createdRole.id,
          permission_id: permissionRecord.id,
        },
      });
    }
  }

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: { name: company.name },
      create: company,
    });

    //* Every company gets a trial subscription so the billing endpoints
    //* work out of the box for the seeded users
    await prisma.subscription.upsert({
      where: { company_id: company.id },
      update: {},
      create: {
        company_id: company.id,
        expires_at: new Date(Date.now() + FREE_TRIAL_DURATION_MS),
      },
    });
  }

  for (const user of users) {
    const { password, ...rest } = user;
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...rest, password: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS) },
    });

    const companyRoleName = companyRoleNameForUser(user);

    //* Replace (not upsert) the user's company roles: v1 keeps exactly one
    //* role per user, so re-seeding must never leave duplicate role rows
    await prisma.$transaction([
      prisma.userRole.deleteMany({
        where: {
          user_id: createdUser.id,
        },
      }),
      prisma.userRole.create({
        data: {
          user_id: createdUser.id,
          role_id: roleIdsByName[companyRoleName],
        },
      }),
    ]);

    console.log(`Seeded user ${user.email} (${user.role}, ${companyRoleName})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
