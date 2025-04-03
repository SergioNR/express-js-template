// https://docs.stripe.com/webhooks

import { logError } from '../../../../config/loggerFunctions.mjs';

export const paymentCompletedWebhook = async (req, res) => { // * Should probably add a
// * more specific name but cant think of any since all the stripe
// * events are handled in this function
  const event = req.body;

  // const { variable1 } = event.data.object;
  // const clientReferenceId = event.data.object.client_reference_id;
  // Handle each type of event
  switch (event.type) {
    case 'checkout.session.completed':

      break;
      // ... handle other event types
    default:
      logError('Unhandled event type in Stripe webhook paymentCompleted.', event.type);
  }

  res.status(200).send();
};
