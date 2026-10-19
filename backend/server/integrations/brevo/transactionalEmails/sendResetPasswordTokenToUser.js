import { brevoClient, companyEmails } from './brevo.js';
import { logError } from '../../../config/loggerFunctions.js';

export const sendResetPasswordTokenToUser = async (userEmail, passwordResetToken) => {
  try {
    return await brevoClient.transactionalEmails.sendTransacEmail({
      sender: {
        // name: "XXX", //* Managed in the template
        email: companyEmails.support,
      },
      to: [{
        email: userEmail,
      }],
      templateId: 2, //* Direct link to the template --> https://my.brevo.com/camp/template/2/setup
      params: {
        passwordResetToken: passwordResetToken,
      },
    });
  } catch (error) {
    return logError('error sending sendResetPasswordTokenToUser', error); //* NOT throwing an error since req-res
    //*  flow should not be interrupted with this email send operation
  }
};
