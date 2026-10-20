import bcrypt from 'bcryptjs';
import { prisma } from '../server/config/prismaClient.js';
import { BCRYPT_SALT_ROUNDS, FREE_TRIAL_DURATION_MS } from '../server/config/security.js';

const ACME_COMPANY_ID = '5f8b7c2e-1d4a-4f6b-8c3a-2a1b3c4d5e6f';
const GLOBEX_COMPANY_ID = '9e7d6c5b-4a3f-4e2d-1b0a-7f8e9d0a1b2c';

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

async function main() {
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
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...rest, password: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS) },
    });
    console.log(`Seeded user ${user.email} (${user.role})`);
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
