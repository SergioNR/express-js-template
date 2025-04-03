import { client } from '../config/posthog-node.mjs';
import { logError } from '../config/loggerFunctions.mjs';

export const posthogUserSignedUp = async (user) => {
  try {
    client.capture({
      distinctId: user.id,
      event: 'userSignedUp',
      properties: {
        $set: {
        //   userEmail: user.userDetails.email,
        //* Not needed for now and its safer in regards to GDPR
          userRole: user.role,
        },
      },
    });
  } catch (error) {
    logError('error sending event to posthog', error, 'userSignedUp');
  } finally {
    await client.shutdown();
  }
};

export const posthogUserSuccessLoggedIn = async (distinctId, loginMethod) => {
  try {
    client.capture({
      distinctId,
      event: 'userLoggedIn',
      properties: {
        loginMethod,
      },
    });
  } catch (error) {
    logError('error sending event to posthog', error, 'userSuccessLogin');
  } finally {
    await client.shutdown();
  }
};

export const posthogUserLoggedOut = async (distinctId) => {
  try {
    client.capture({
      distinctId,
      event: 'userLoggedOut',
    });
  } catch (error) {
    logError('error sending event to posthog', error, 'userLoggedOut');
  } finally {
    await client.shutdown();
  }
};

export const posthogUserPaymentCompleted = async (distinctId) => {
  try {
    client.capture({
      distinctId: `${distinctId}`,
      event: 'paymentCompleted',
    });
  } catch (error) {
    logError('error sending event to posthog', error, 'paymentCompleted');
  } finally {
    client.shutdown();
  }
};
