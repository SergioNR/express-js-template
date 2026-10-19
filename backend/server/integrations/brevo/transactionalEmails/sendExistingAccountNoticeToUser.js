import { brevoClient, companyEmails } from './brevo.js';
import { logError, logInfo } from '../../../config/loggerFunctions.js';

export const sendExistingAccountNoticeToUser = async (userEmail) => {
  const templateId = process.env.BREVO_ACCOUNT_EXISTS_TEMPLATE_ID;

  //* No-op when no template is configured - the register response stays
  //* identical either way so this can never become an enumeration oracle
  if (!templateId) {
    return logInfo('BREVO_ACCOUNT_EXISTS_TEMPLATE_ID not set - skipping existing account notice', { email: userEmail });
  }

  try {
    return await brevoClient.transactionalEmails.sendTransacEmail({
      sender: {
        email: companyEmails.support,
      },
      to: [{
        email: userEmail,
      }],
      templateId: Number(templateId),
    });
  } catch (error) {
    return logError('error sending sendExistingAccountNoticeToUser', error); //* NOT throwing an error since req-res
    //*  flow should not be interrupted by this email send operation
  }
};
