import { client } from '../config/posthog-node.js';
import { logError } from '../config/loggerFunctions.js';

export const posthogUserSignedUp = async (user) => {
  try {
    client.groupIdentify({
      groupType: 'company',
      groupKey: user.company_id,
      properties: {
        name: 'unknown',
        subscription: 'free trial',
      },
    });

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
