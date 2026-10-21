import { client } from '../config/posthog-node.js';
import { logError } from '../config/loggerFunctions.js';

//* `createdCompany` is true only for self-registration, where the signup
//* also created a brand-new company. Invite acceptance joins an existing
//* company, whose group properties must not be overwritten with defaults
export const posthogUserSignedUp = async (user, { createdCompany = false } = {}) => {
  try {
    if (createdCompany) {
      client.groupIdentify({
        groupType: 'company',
        groupKey: user.company_id,
        properties: {
          name: 'unknown',
          subscription: 'free trial',
        },
      });
    }

    client.capture({
      distinctId: user.id,
      event: 'userSignedUp',
      properties: {
        $set_once: {
          email: user.email,
          role: user.role,
          company: user.company_id,
        },
      },
      groups: { company: user.company_id },
    });
  } catch (error) {
    logError('error sending posthogUserSignedUp event to posthog', error, 'userSignedUp');
  }
};

export const posthogUserSuccessLoggedIn = async (distinctId, loginMethod) => {
  try {
    client.capture({
      distinctId: distinctId,
      event: 'userLoggedIn',
      properties: {
        loginMethod: loginMethod,
      },
    });
  } catch (error) {
    logError('error sending posthogUserSuccessLoggedIn event to posthog', error, 'userSuccessLogin');
  }
};

export const posthogUserDeleteAccount = async (distinctId) => {
  try {
    client.capture({
      distinctId: distinctId,
      event: 'userDeletedAccount',
      properties: {
        $set: {
          isDeleted: true,
        },
        $unset: ['email'],
      },
    });
  } catch (error) {
    logError('error sending posthogUserDeleteAccount event to posthog', error, 'userDeletedAccount');
  }
};
