import { prisma } from '../config/prismaClient.js';

//* Cheapest possible round trip - proves the pool can hand out a connection
//* and the database answers, without touching any table
export const checkDatabaseConnectionInDb = async () => {
  await prisma.$queryRaw`SELECT 1`;
};
