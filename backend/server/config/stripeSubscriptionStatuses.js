//* Stripe subscription statuses that grant access until the end of the
//* current billing period (past_due keeps access while Stripe retries the
//* payment). Shared by the webhook sync and the pre-checkout "already
//* subscribed" check so both agree on what counts as subscribed
export const ACCESS_GRANTING_STATUSES = ['active', 'trialing', 'past_due'];
