import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/config/stripe.js', () => ({
  stripeInstance: {
    checkout: {
      sessions: {
        create: jest.fn(),
        list: jest.fn(),
        expire: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
    },
    subscriptions: {
      list: jest.fn(),
      update: jest.fn(),
      retrieve: jest.fn(),
    },
  },
}));

jest.unstable_mockModule('../server/config/planPrices.js', () => ({
  getStripePriceId: jest.fn(() => 'price_pro_monthly'),
}));

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logError: jest.fn(),
}));

const { stripeInstance } = await import('../server/config/stripe.js');
const {
  IDEMPOTENCY_WINDOW_MS,
  createStripeCheckoutSession,
  expireOpenStripeCheckoutSessions,
} = await import('../server/integrations/stripe/checkoutSession.js');
const { createCompanyIdInStripe } = await import('../server/integrations/stripe/customerId.js');
const {
  cancelCompanySubscriptionInStripe,
  hasActiveStripeSubscription,
} = await import('../server/integrations/stripe/subscription.js');
const { logError } = await import('../server/config/loggerFunctions.js');

const checkoutKey = () => stripeInstance.checkout.sessions.create.mock.calls.at(-1)[1].idempotencyKey;
const customerKey = () => stripeInstance.customers.create.mock.calls.at(-1)[1].idempotencyKey;

describe('createStripeCheckoutSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    stripeInstance.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.test/s' });
  });

  it('replays the same idempotency key for the same company/plan/price inside the window', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2030-01-01T00:01:00Z'));
    await createStripeCheckoutSession('company-1', 'cus_1', 'user-1', 'pro', 'monthly');
    const firstKey = checkoutKey();

    jest.setSystemTime(new Date('2030-01-01T00:05:00Z'));
    await createStripeCheckoutSession('company-1', 'cus_1', 'user-1', 'pro', 'monthly');

    expect(checkoutKey()).toBe(firstKey);
    expect(firstKey).toContain('company-1');
    expect(firstKey).toContain('price_pro_monthly');
  });

  it('rotates the idempotency key once the window moved on and per plan', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2030-01-01T00:01:00Z'));
    await createStripeCheckoutSession('company-1', 'cus_1', 'user-1', 'pro', 'monthly');
    const firstKey = checkoutKey();

    await createStripeCheckoutSession('company-1', 'cus_1', 'user-1', 'pro', 'yearly');
    expect(checkoutKey()).not.toBe(firstKey);

    jest.setSystemTime(new Date(Date.now() + IDEMPOTENCY_WINDOW_MS));
    await createStripeCheckoutSession('company-1', 'cus_1', 'user-1', 'pro', 'monthly');
    expect(checkoutKey()).not.toBe(firstKey);
  });
});

describe('expireOpenStripeCheckoutSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stripeInstance.checkout.sessions.expire.mockResolvedValue({});
  });

  it('expires every open session of the customer', async () => {
    stripeInstance.checkout.sessions.list.mockResolvedValue({ data: [{ id: 'cs_1' }, { id: 'cs_2' }] });

    await expect(expireOpenStripeCheckoutSessions('cus_1')).resolves.toBe(2);

    expect(stripeInstance.checkout.sessions.list).toHaveBeenCalledWith({ customer: 'cus_1', status: 'open' });
    expect(stripeInstance.checkout.sessions.expire).toHaveBeenCalledWith('cs_1');
    expect(stripeInstance.checkout.sessions.expire).toHaveBeenCalledWith('cs_2');
  });

  it('does nothing when there is no open session', async () => {
    stripeInstance.checkout.sessions.list.mockResolvedValue({ data: [] });

    await expect(expireOpenStripeCheckoutSessions('cus_1')).resolves.toBe(0);
    expect(stripeInstance.checkout.sessions.expire).not.toHaveBeenCalled();
  });
});

describe('createCompanyIdInStripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stripeInstance.customers.create.mockResolvedValue({ id: 'cus_new' });
  });

  it('keeps the same idempotency key for the same company and email', async () => {
    await createCompanyIdInStripe('owner@acme.test', 'company-1');
    const firstKey = customerKey();
    await createCompanyIdInStripe('owner@acme.test', 'company-1');

    expect(customerKey()).toBe(firstKey);
    expect(firstKey).toContain('company-1');
    expect(firstKey).not.toContain('owner@acme.test');
  });

  it('changes the idempotency key when the email changes', async () => {
    await createCompanyIdInStripe('owner@acme.test', 'company-1');
    const firstKey = customerKey();
    await createCompanyIdInStripe('other@acme.test', 'company-1');

    expect(customerKey()).not.toBe(firstKey);
  });
});

describe('hasActiveStripeSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('asks Stripe for one active subscription of the customer', async () => {
    stripeInstance.subscriptions.list.mockResolvedValue({ data: [{ id: 'sub_1' }] });

    await expect(hasActiveStripeSubscription('cus_1')).resolves.toBe(true);
    expect(stripeInstance.subscriptions.list).toHaveBeenCalledWith({ customer: 'cus_1', status: 'active', limit: 1 });
  });

  it('is false when none is active', async () => {
    stripeInstance.subscriptions.list.mockResolvedValue({ data: [] });

    await expect(hasActiveStripeSubscription('cus_1')).resolves.toBe(false);
  });
});

describe('cancelCompanySubscriptionInStripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stripeInstance.subscriptions.update.mockResolvedValue({});
  });

  it('cancels a real Stripe subscription at period end', async () => {
    await cancelCompanySubscriptionInStripe({ id: 'sub_123' });

    expect(stripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_123', { cancel_at_period_end: true });
  });

  it('skips trial rows (non sub_ ids) and missing subscriptions', async () => {
    await cancelCompanySubscriptionInStripe({ id: 'trial-uuid' });
    await cancelCompanySubscriptionInStripe(null);

    expect(stripeInstance.subscriptions.update).not.toHaveBeenCalled();
  });

  it('swallows Stripe failures and logs them', async () => {
    stripeInstance.subscriptions.update.mockRejectedValue(new Error('stripe down'));

    await expect(cancelCompanySubscriptionInStripe({ id: 'sub_123' })).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});
