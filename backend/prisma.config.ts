import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  //* Migrations run over the direct (non-pooled) URL, as directUrl did in Prisma 6.
  //* The runtime client uses the pg driver adapter in server/config/prismaClient.js.
  datasource: {
    url: env('PRISMA_POSTGRES_DIRECT_URL'),
  },
});
