import pino from 'pino';
import pretty from 'pino-pretty';


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
    transport: {
        target: 'pino-pretty', // Correctly specify the target as a string
        options: {
            colorize: true, // Optional: colorize the output for better readability
            ignore: 'pid,hostname', // Optional: ignore the pid and hostname fields
        },
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