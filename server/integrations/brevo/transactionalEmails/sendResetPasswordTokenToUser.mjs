import brevo, { TransactionalEmailsApi } from '@getbrevo/brevo';
import { logError } from '../../../config/loggerFunctions.mjs';

const apiInstance = new TransactionalEmailsApi();

const { apiKey } = apiInstance.authentications;
apiKey.apiKey = process.env.BREVO_API_KEY;

export const sendResetPasswordTokenToUser = async (email, token) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      // name: "XXX", //* Managed in the template
      email: 'no-reply@yourdomain.com',
    };

    sendSmtpEmail.to = [{
      email: email,
    }];

    // sendSmtpEmail.bcc = [{ //* Cant be managed in the template
    //   email: 'xxx',
    // }];

    sendSmtpEmail.templateId = 2; //* Direct link to the template --> https://my.brevo.com/camp/template/2/setup
    // sendSmtpEmail.subject = subject; //* Managed in the template
    // sendSmtpEmail.replyTo = {  //* Managed in the template
    //     email: "xxxx",
    //     name: "xxxx"
    // };
    sendSmtpEmail.headers = {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    };
    sendSmtpEmail.params = {
      token: token,

    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    logError('error sending sendResetPasswordTokenToUser', error);
  }
};
