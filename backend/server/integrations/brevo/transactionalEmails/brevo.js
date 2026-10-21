import { BrevoClient } from '@getbrevo/brevo';
import { requireEnv } from '../../../config/requiredEnv.js';

requireEnv('BREVO_API_KEY', 'refusing to start without transactional email delivery');

export const brevoClient = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

export const companyEmails = {
  support: process.env.BREVO_SENDER_EMAIL,
  billing: process.env.BREVO_SENDER_EMAIL,
  hello: process.env.BREVO_SENDER_EMAIL,
};

//* sendTransacEmail available properties -- eg: brevoClient.transactionalEmails.sendTransacEmail({ sender: {}, ... })
// 'sender';
// 'to'
// 'bcc'
// 'cc'
// 'htmlContent'
// 'textContent'
// 'subject'
// 'replyTo'
// 'attachment'
// 'headers'
// 'templateId'
// 'params'
// 'messageVersions'
// 'tags'?: Array<string>;
// 'scheduledAt';
