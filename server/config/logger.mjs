import pino from 'pino';

const redactOptions = {
    paths: ['context.userData.email', 'context.userData.password'],
    censor: '[REDACTED]'
};


export const logger = pino({
    redact: redactOptions,
    transport: {
        targets: [
            {
                target: 'pino-mongodb',
                options: {
                    uri: process.env.MONGODB_CONNECTIONSTRING,
                    database: 'logs',
                    collection: 'log-collection',
                    mongoOptions: {
                        auth: {
                            username: process.env.MONGODB_USERNAME,
                            password: process.env.MONGODB_PASSWORD
                        }
                    }
                }
            },
            ...(process.env.NODE_ENV !== 'localhost' ? [{
                target: '@logtail/pino',
                options: {
                    sourceToken: process.env.PINOJS_SOURCE_TOKEN,
                }
            }] : []),
            ...(process.env.NODE_ENV === 'localhost' ? [{
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                }
            }] : []),
        ]
    },
});
