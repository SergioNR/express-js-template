import brevo from '@getbrevo/brevo';
import { TransactionalEmailsApi } from '@getbrevo/brevo';

import { getTestDetails } from '../models/testModel.mjs';

const apiInstance = new TransactionalEmailsApi();

let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

export const sendPaymentCompletedTransactionalEmail = async (testRequestId) => {
    try {

        const testDetails = await getTestDetails(testRequestId);

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        
        sendSmtpEmail.sender = {
            // name: "Sergio de AnalizaTuApp", //* Managed in the template
            email: "s.navarroredondo@gmail.com"
        };
        
        sendSmtpEmail.to = [{
            email: testDetails.requesterEmail
        }];

        sendSmtpEmail.bcc = [{ //* Cant be managed in the template
            email: "s.navarroredondo@gmail.com"
        }];
        
        sendSmtpEmail.templateId = 2; //* Direct link to the template --> https://my.brevo.com/camp/template/2/setup
        // sendSmtpEmail.subject = subject; //* Managed in the template
        // sendSmtpEmail.replyTo = {  //* Managed in the template
        //     email: "sergio@analizatuapp.com",
        //     name: "Sergio de AnalizaTuApp"
        // };
        sendSmtpEmail.headers = { 
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
            "accept": "application/json",
        };
        sendSmtpEmail.params = {
            testUrl: testDetails.url,

        };

        await apiInstance.sendTransacEmail(sendSmtpEmail)

    } catch (error) {
        console.error(error);
    }
};