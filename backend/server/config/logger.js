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

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        destination: 1,
        colorize: true,
      },
    },
  ],
});

// Apply redaction at the logger level so sensitive fields are removed
export const logger = pino(
  {
    redact: redactOptions,
  },
  transport,
);
