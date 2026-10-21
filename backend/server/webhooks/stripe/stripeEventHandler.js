import { logError, logWarn } from '../../config/loggerFunctions.js';
import { deleteSubscriptionInDb, upsertSubscriptionInDb } from '../../models/subscriptionModel.js';
import { stripeInstance } from '../../config/stripe.js';

export const stripeEventHandler = async (req, res) => {
  try {
    let event;

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logError('error in stripe webhook', err);
      return res.status(400).json({
        message: `Webhook Error: ${err.message}`,
      });
    }

    // console.log('Stripe event received:', event.type); //* Use for debugging incoming events

    switch (event.type) {
      case 'checkout.session.completed': {
        // Sent when a customer completes a checkout session
        // Create or update the subscription in DB
        if (event.data.object.payment_status === 'paid') {
          const subscriptionId = event.data.object.subscription;

          if (!subscriptionId) {
            logWarn('checkout.session.completed event without subscription id - skipping', event.data.object, event.type);
            break;
          }

          const checkoutSessionData = {
            companyId: event.data.object.client_reference_id,
            userId: event.data.object.metadata.userId,
            subscriptionId,
          };

          //* Awaited so a DB failure surfaces as a 500 and Stripe retries the
          //* event instead of treating it as processed
          await upsertSubscriptionInDb(checkoutSessionData);
        }
        break;
      }

      case 'customer.subscription.deleted':
        // Sent when a subscription ends.
        // Useful for notifying users about the ending of their subscription.

        const subscriptionDeletionData = {
          subscriptionId: event.data.object.id,
          customerId: event.data.object.customer,
        };
        await deleteSubscriptionInDb(subscriptionDeletionData);

        // TODO -- send an email to the user about the subscription end
        break;

      // ... handle other event types
      default:
      // console.log('Unhandled event type:', event.type); //* Activate for debugging
        // logError('Unhandled event type in Stripe webhook.', event.type); //* Activate for debugging
    }

    return res.status(200).json({});
  } catch (error) {
    logError('error in stripeEventHandler', error);
    return res.status(500).json({});
  }
};

//* DOCS --> https://docs.stripe.com/webhooks
