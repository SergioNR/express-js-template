import pino from 'pino';

const redactOptions = {
  paths: [
    'context.email',
    'context.password',
    'context.inviteToken',
    'context.userData.inviteToken',
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
