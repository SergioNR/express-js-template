import { PostHog } from 'posthog-node';
import { logError } from './loggerFunctions.js';

const apiKey = process.env.POSTHOG_API_KEY;

const noopClient = {
  capture: () => {},
  groupIdentify: () => {},
  on: () => {},
  shutdown: async () => {},
};

export const client = apiKey
  ? new PostHog(apiKey, { host: 'https://eu.i.posthog.com' })
  : noopClient;

if (apiKey) {
  client.on('error', (error) => {
    logError('PostHog error', error);
  });
}
