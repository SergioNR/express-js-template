import brevo, { TransactionalEmailsApi } from '@getbrevo/brevo';

export const apiInstance = new TransactionalEmailsApi();
const { apiKey } = apiInstance.authentications;
apiKey.apiKey = process.env.BREVO_API_KEY;

export const companyEmails = {
  support: process.env.BREVO_SENDER_EMAIL,
  billing: process.env.BREVO_SENDER_EMAIL,
  hello: process.env.BREVO_SENDER_EMAIL,
};

export const emailInstance = new brevo.SendSmtpEmail();

emailInstance.headers = {
  'api-key': process.env.BREVO_API_KEY,
  'content-type': 'application/json',
  accept: 'application/json',
};

//* emailInstance available properties -- eg: emailInstance.sender = {}
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
// 'scheduledAt'
