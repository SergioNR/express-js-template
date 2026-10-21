import { createRequire } from 'node:module';
import pino from 'pino';

const redactOptions = {
  paths: [
    'context.email',
    'context.password',
    'context.inviteToken',
    'context.userData.inviteToken',
    //* Request bodies (e.g. body-parser errors carry the raw body, which can
    //* contain passwords) must never reach the logs
    'context.errorDetails.body',
    'context.*.body',
    'context.body',
  ],
  censor: '[REDACTED]',
};

//* Human-readable output only for local development. Deployed environments
//* emit plain JSON lines on stdout so the log collector can parse them, and
//* pino-pretty (a devDependency) is never loaded there
const isLocalhost = process.env.DEPLOY_ENVIRONMENT === 'localhost';

//* The prod image omits devDependencies, so running it locally with
//* DEPLOY_ENVIRONMENT=localhost would crash the transport worker - fall back
//* to JSON whenever pino-pretty cannot be resolved
const isPinoPrettyInstalled = () => {
  try {
    createRequire(import.meta.url).resolve('pino-pretty');

    return true;
  } catch {
    return false;
  }
};

const transport = isLocalhost && isPinoPrettyInstalled()
  ? pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        options: {
          destination: 1,
          colorize: true,
        },
      },
    ],
  })
  : undefined;

// Apply redaction at the logger level so sensitive fields are removed
export const logger = pino(
  {
    redact: redactOptions,
  },
  transport,
);
