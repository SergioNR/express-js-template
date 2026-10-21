import { brevoClient, companyEmails } from './brevo.js';
import { logError } from '../../../config/loggerFunctions.js';

export const sendTeamInviteToUser = async (userEmail, inviteToken, companyName, inviterEmail) => {
  try {
    return await brevoClient.transactionalEmails.sendTransacEmail({
      sender: {
        // name: "XXX", //* Managed in the template
        email: companyEmails.support,
      },
      to: [{
        email: userEmail,
      }],
      templateId: 3, //* Direct link to the template --> https://my.brevo.com/camp/template/3/setup
      //* The clickable link to <frontend>/auth/accept-invite?inviteToken=...
      //* is built inside the Brevo template body, not in code
      params: {
        inviteToken: inviteToken,
        companyName: companyName,
        inviterEmail: inviterEmail,
      },
    });
  } catch (error) {
    return logError('error sending sendTeamInviteToUser', error); //* NOT throwing an error since req-res
    //*  flow should not be interrupted with this email send operation
  }
};
