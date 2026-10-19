import { apiInstance, emailInstance, companyEmails } from './brevo.js';
import { logError } from '../../../config/loggerFunctions.js';

export const sendResetPasswordTokenToUser = async (userEmail, passwordResetToken) => {
  try {
    emailInstance.sender = {
      // name: "XXX", //* Managed in the template
      email: companyEmails.support,
    };

    emailInstance.to = [{
      email: userEmail,
    }];

    emailInstance.templateId = 2; //* Direct link to the template --> https://my.brevo.com/camp/template/2/setup

    emailInstance.params = {
      passwordResetToken: passwordResetToken,
    };

    return await apiInstance.sendTransacEmail(emailInstance);
  } catch (error) {
    return logError('error sending sendResetPasswordTokenToUser', error); //* NOT throwing an error since req-res
    //*  flow should not be interrupted with this email send operation
  }
};
