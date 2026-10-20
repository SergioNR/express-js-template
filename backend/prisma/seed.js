import bcrypt from 'bcryptjs';
import { prisma } from '../server/config/prismaClient.js';
import { BCRYPT_SALT_ROUNDS, FREE_TRIAL_DURATION_MS } from '../server/config/security.js';

const ACME_COMPANY_ID = '5f8b7c2e-1d4a-4f6b-8c3a-2a1b3c4d5e6f';
const GLOBEX_COMPANY_ID = '9e7d6c5b-4a3f-4e2d-1b0a-7f8e9d0a1b2c';

//* Same deterministic UUIDs as the team_invites_rbac migration so re-running
//* the seed on a migrated database converges on the same rows
const COMPANY_OWNER_ROLE_ID = '00000000-0000-4000-8000-000000000001';
const COMPANY_MEMBER_ROLE_ID = '00000000-0000-4000-8000-000000000003';

const roles = [
  {
    id: COMPANY_OWNER_ROLE_ID,
    name: 'company_owner',
    permissions: ['team.view', 'team.invite', 'team.remove', 'team.manage_roles'],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'company_admin',
    permissions: ['team.view', 'team.invite', 'team.remove'],
  },
  {
    id: COMPANY_MEMBER_ROLE_ID,
    name: 'company_member',
    permissions: ['team.view'],
  },
];

const permissions = [
  { id: '00000000-0000-4000-8000-000000000101', name: 'team.view' },
  { id: '00000000-0000-4000-8000-000000000102', name: 'team.invite' },
  { id: '00000000-0000-4000-8000-000000000103', name: 'team.remove' },
  { id: '00000000-0000-4000-8000-000000000104', name: 'team.manage_roles' },
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
const companyRoleForUser = (user) => (
  user.role === 'admin'
    ? { id: COMPANY_OWNER_ROLE_ID, name: 'company_owner' }
    : { id: COMPANY_MEMBER_ROLE_ID, name: 'company_member' }
);

async function main() {
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

    const companyRole = companyRoleForUser(user);

    await prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: createdUser.id,
          role_id: companyRole.id,
        },
      },
      update: {},
      create: {
        user_id: createdUser.id,
        role_id: companyRole.id,
      },
    });

    console.log(`Seeded user ${user.email} (${user.role}, ${companyRole.name})`);
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
