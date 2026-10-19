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

// NOT being used currently due to implementation issues - cant figure how to get the distinctId
export const posthogUserLoggedOut = async (distinctId) => {
  try {
    client.capture({
      distinctId,
      event: 'userLoggedOut',
    });
  } catch (error) {
    logError('error sending posthogUserLoggedOut event to posthog', error, 'userLoggedOut');
  }
};

export const posthogUserSubscriptionCreated = async (checkoutSessionData) => {
  try {
    client.capture({
      distinctId: checkoutSessionData.userId,
      event: 'subscriptionCreated',
      /* properties: {
        $set: { // TODO - decide if this should be a person or event property & probably should be a company ID
        planName: checkoutSessionData.metadata.planName, // TODO - ADD THIS VALUE
        planBillingCycle: checkoutSessionData.metadata.planBillingCycle, // TODO - ADD THIS VALUE
      },
    }, */
    });
  } catch (error) {
    logError('error sending posthogUserSubscriptionCreated event to posthog', error, 'subscriptionCreated');
  }
};

export const posthogUserSubscriptionEnded = async (subscriptionDeletionData) => {
  try {
    client.capture({
      distinctId: subscriptionDeletionData.metadata.userId,
      event: 'subscriptionCancelled',
    });
  } catch (error) {
    logError('error sending posthogUserSubscriptionEnded event to posthog', error, 'subscriptionEnded');
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
