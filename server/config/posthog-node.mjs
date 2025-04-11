import { PostHog } from 'posthog-node';
import { logError } from './loggerFunctions.mjs';

export const client = new PostHog(
  process.env.POSTHOG_API_KEY,
  { host: 'https://eu.i.posthog.com' },
);

client.on('error', (error) => {
  logError('PostHog error', error);
});
/*
https://webhook.site/#!/view/efc0e487-0d95-44eb-9ba1-f66b248d1c1b/d26a0008-2a26-4979-b57a-40f19993ebdf/1 //* Webhook.site link for debugging the PostHog events

https://posthog.com/docs/product-analytics/troubleshooting //* PostHog troubleshooting documentation

*/
