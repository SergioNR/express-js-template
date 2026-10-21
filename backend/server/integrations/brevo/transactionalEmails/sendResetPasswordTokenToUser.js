import {
  brevoClient,
  commonTemplateParams,
  companyEmails,
  templateIds,
} from './brevo.js';
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
      templateId: templateIds.resetPassword, //* Brevo dashboard --> https://my.brevo.com/camp/template/<id>/setup
      //* The clickable link to {{ params.appOrigin }}/auth/reset-password?token=...
      //* is built inside the Brevo template body, not in code
      params: {
        ...commonTemplateParams(),
        passwordResetToken: passwordResetToken,
      },
    });
  } catch (error) {
    return logError('error sending sendResetPasswordTokenToUser', error); //* NOT throwing an error since req-res
    //*  flow should not be interrupted with this email send operation
  }
};
