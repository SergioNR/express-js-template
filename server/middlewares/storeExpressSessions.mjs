import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const prismaSessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000, // ms
  dbRecordIdIsSessionId: true,
  dbRecordIdFunction: undefined,

});

export const storeSessions = session({
  secret: process.env.SESSION_SECRET,
  resave: false, // https://www.npmjs.com/package/express-session#resave - Set to false because `touch` is implemented
  saveUninitialized: false, // https://www.npmjs.com/package/express-session#saveuninitialized - Set to false because we'll only save sessions with req.session data (eg: logins, storing relevant info that we want to keep)
  cookie: {
    maxAge: 86400000, // 24 hours
    secure: process.env.NODE_ENV === 'production', // Secure in production
    httpOnly: true,
    SameSite: 'None',
  },
  store: prismaSessionStore,
});
