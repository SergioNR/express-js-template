// https://docs.stripe.com/webhooks

export const paymentCompletedWebhook = async (req, res) => { // * Should probably add a more specific name but cant think of any since all the stripe events are handled in this function
  const event = req.body;
  // Handle each type of event
  switch (event.type) {
    case 'checkout.session.completed':

      const clientReferenceId = event.data.object.client_reference_id;
      const { variable1 } = event.data.object;

      break;
      // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).send();
};
