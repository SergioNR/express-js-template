import { logError } from '../../../../config/loggerFunctions.mjs';
import { posthogUserPaymentCompleted } from '../../../../models/posthogModel.mjs';
import { markSubscriptionAsCancelledInDb, storeSubscriptionInDb } from '../../../../models/subscriptionModel.mjs';

export const stripeEventHandler = async (req, res) => { // * Should probably add a
// * more specific name but cant think of any since all the stripe
// * events are handled in this function
  try {
    const event = req.body;

    // console.log('Stripe event received:', event.type); //* Use for debugging incoming events

    // const stripeSignature = req.headers['stripe-signature'];
    // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    switch (event.type) {
      case 'checkout.session.completed':
        // Sent when a customer completes a checkout session

        // console.log('Checkout session completed:', event.data.object); //* Debug purposes

        // const checkoutSessionData = { //* Unused
        //   userId: event.data.object.client_reference_id,
        //   amountTax: event.data.object.total_details.amount_tax,
        //   amountTotal: event.data.object.amount_total, // need to x100 to remove decimals
        //   subtotalAmount: event.data.object.amount_subtotal,
        //   currency: event.data.object.currency,
        //   billingCycle: event.data.object.metadata.billingCycle,
        //   stripeSubscriptionId: event.data.object.subscription,
        //   paymentStatus: event.data.object.payment_status,
        //   invoiceId: event.data.object.invoice,
        // };

        // storeSubscriptionInDb(checkoutSessionData);

        // TODO -- send an email to the user about the subscription update
        break;

      case 'checkout.session.expired':
      // Sent when a checkout session expires. - 24 hours after creation
      // This indicates that the customer did not complete the payment in time.
      // Useful for notifying users about the expired session.
      // TODO -- send an email to the user about the expired session
        break;

      case 'customer.subscription.created':
        // Sent when a subscription is created.

        const subscriptionData = {
          customer: event.data.object.customer,
          status: event.data.object.status,
        };

        await storeSubscriptionInDb(subscriptionData);
        break;

      case 'customer.subscription.deleted':
        // Sent when a subscription ends.
        // Useful for notifying users about the ending of their subscription.

        const expirationData = {
          status: event.data.object.id,
          customer: event.data.object.customer,

        };
        markSubscriptionAsCancelledInDb(expirationData);

        // TODO -- send an email to the user about the subscription expiration
        break;

        // case 'invoice.upcoming':
        //   // Sent a few days before the subscription renewal date.
        //   // Indicates that an invoice is about to be generated for the next billing cycle.
        //   // Useful for notifying users about the upcoming charge

        //   // TODO -- send an email to the user reminding of subscription renewal
        //   break;

        // case 'invoice.paid':
        //   // Sent when an invoice payment attempt succeeds.
        //   // This indicates that the customer's payment was successful.
        //   // Useful for notifying users about successful payments.
        //   // TODO -- send an email to the user about the successful payment
        //   // TODO -- update the user subscription status in the database
        //   break;

        // case 'invoice.payment_failed':
        //   // Sent when an invoice payment attempt fails.
        //   // This can happen for various reasons, such as insufficient funds or an expired card.
        //   // notify users about the failed payment and prompting them to update their payment method.
        //   // TODO -- send an email to the user about the failed payment
        //   break;

        // case 'charge.refunded':
        // Sent when a charge is refunded.
        // This indicates that the customer's payment was reversed.
        // Useful for notifying users about the refund.
        // TODO -- send an email to the user about the refund
        // TODO -- update the user subscription status in the database
        break;

      // ... handle other event types
      default:
      // console.log('Unhandled event type:', event.type);
        // logError('Unhandled event type in Stripe webhook paymentCompleted.', event.type);
    }

    res.status(200).send();
  } catch (error) {
    logError('error in stripeEventHandler', error);
    res.status(500).send('Internal Server Error');
  }
};

//* DOCS --> https://docs.stripe.com/webhooks
