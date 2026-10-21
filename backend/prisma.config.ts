import 'dotenv/config';
import { defineConfig } from 'prisma/config';

//* `prisma generate` runs at Docker build time, where no database URL exists.
//* `env()` throws on an unset variable, so a placeholder keeps generation
//* working - every command that actually connects (migrate, seed, studio)
//* runs where PRISMA_POSTGRES_DIRECT_URL is set and uses the real value.
//* `||` (not `??`) so an empty value - e.g. `PRISMA_POSTGRES_DIRECT_URL=` left
//* in a .env file - also falls back instead of handing Prisma an empty URL;
//* start.sh refuses to migrate without a real value
const PLACEHOLDER_URL = 'postgresql://build:build@localhost:5432/build';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'node --import tsx --env-file=.env prisma/seed.js',
  },
  //* Migrations run over the direct (non-pooled) URL, as directUrl did in Prisma 6.
  //* The runtime client uses the pg driver adapter in server/config/prismaClient.js.
  datasource: {
    url: process.env.PRISMA_POSTGRES_DIRECT_URL || PLACEHOLDER_URL,
  },
});
