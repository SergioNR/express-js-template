import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client/client.ts';
import { requireEnv } from './requiredEnv.js';

requireEnv('PRISMA_POSTGRES_CONNECTION_STRING', 'refusing to start without a database connection');

//* Prisma 7 requires a driver adapter; the pg adapter replaces the
//* schema-level connection string for the runtime client
const adapter = new PrismaPg({
  connectionString: process.env.PRISMA_POSTGRES_CONNECTION_STRING,
});

export const prisma = new PrismaClient({ adapter });
