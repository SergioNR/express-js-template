import { apiInstance, emailInstance } from './brevo.mjs';
import { logError } from '../../../config/loggerFunctions.mjs';

export const sendPaymentCompletedTransactionalEmail = async (email, param) => {
  try {
    emailInstance.sender = {
      // name: "XXX", //* Managed in the template
      email: 'no-reply@yourdomain.com',
    };

    emailInstance.to = [{
      email: email,
    }];

    emailInstance.templateId = 2; //* Direct link to the template --> https://my.brevo.com/camp/template/2/setup

    emailInstance.params = {
      param: param,
    };

    await apiInstance.sendTransacEmail(emailInstance);
  } catch (error) {
    logError('error sending sendPaymentCompletedTransactionalEmail', error);
  }
};
