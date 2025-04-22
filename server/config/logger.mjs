import pino from 'pino';

const redactOptions = {
  paths: ['context.userData.email', 'context.userData.password'],
  censor: '[REDACTED]',
};

const transport = pino.transport({
  redact: redactOptions,
  targets: [
    {
      target: 'pino-pretty',
      options: {
        destination: 1,
        colorize: true,
      },
    },
    // {
    //   target: 'pino-mongodb',
    //   options: {
    //     uri: process.env.MONGODB_CONNECTION_STRING,
    //     database: 'logs',
    //     collection: 'log-collection',
    //     mongoOptions: {
    //       auth: {
    //         username: process.env.MONGODB_USERNAME,
    //         password: process.env.MONGODB_PASSWORD,
    //       },
    //     },
    //   },
    // },
    // {
    //   target: '@logtail/pino',
    //   options: {
    //     sourceToken: process.env.PINOJS_SOURCE_TOKEN,
    //     options: { endpoint: 'https://s1198477.eu-nbg-2.betterstackdata.com' },
    //   },
    // },
  ],
});

export const logger = pino(transport);
