import pino from 'pino';

const redactOptions = {
    paths: ['context.userData.email', 'context.userData.password'],
    censor: '[REDACTED]'
};


export const logger = process.env.NODE_ENV === 'production' ? pino({
    transport: {
        target: 'pino-pretty', // Correctly specify the target as a string
        options: {
            colorize: true, // Optional: colorize the output for better readability
            ignore: 'pid,hostname', // Optional: ignore the pid and hostname fields
        },
    },
    transport: {
        target: `@logtail/pino`,
        options: {
            sourceToken: process.env.PINOJS_PROD,
        }
    }
}) : process.env.HOSTNAME === `localhost` ? pino({
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
                    {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        ignore: 'pid,hostname',
                        },
                    }

                ]
            },
        
}) : pino({ //* 
    transport: {
        target: 'pino-pretty', // Correctly specify the target as a string
        options: {
            colorize: true, // Optional: colorize the output for better readability
            ignore: 'pid,hostname', // Optional: ignore the pid and hostname fields
        },
    },
    transport: {
        target: `@logtail/pino`,
        options: {
            sourceToken: process.env.PINOJS_DEV,
        }
    }
});