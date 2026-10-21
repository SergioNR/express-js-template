import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/config/stripe.js', () => ({
  stripeInstance: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.unstable_mockModule('../server/integrations/stripe/subscription.js', () => ({
  retrieveStripeSubscription: jest.fn(),
}));

jest.unstable_mockModule('../server/models/subscriptionModel.js', () => ({
  getCompanyIdByStripeCustomerIdInDb: jest.fn(),
  getSubscriptionDataInDb: jest.fn(),
  upsertSubscriptionInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
  logInfo: jest.fn(),
}));

const { stripeEventHandler } = await import('../server/webhooks/stripe/stripeEventHandler.js');
const { stripeInstance } = await import('../server/config/stripe.js');
const { retrieveStripeSubscription } = await import('../server/integrations/stripe/subscription.js');
const {
  getCompanyIdByStripeCustomerIdInDb,
  getSubscriptionDataInDb,
  upsertSubscriptionInDb,
} = await import('../server/models/subscriptionModel.js');
const { logWarn } = await import('../server/config/loggerFunctions.js');

const PERIOD_END = 1893456000; //* 2030-01-01T00:00:00Z
const FUTURE = new Date('2030-01-01T00:00:00Z');
const PAST = new Date('2020-01-01T00:00:00Z');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createReq = () => ({
  headers: { 'stripe-signature': 'sig' },
  body: Buffer.from('{}'),
});

const givenEvent = (type, object) => {
  stripeInstance.webhooks.constructEvent.mockReturnValue({
    id: 'evt_1',
    type,
    data: { object },
  });
};

const stripeSubscription = (overrides = {}) => ({
  id: 'sub_new',
  customer: 'cus_1',
  status: 'active',
  ended_at: null,
  items: { data: [{ current_period_end: PERIOD_END }] },
  ...overrides,
});

const run = async () => {
  const res = createMockRes();
  await stripeEventHandler(createReq(), res);
  return res;
};

describe('stripeEventHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCompanyIdByStripeCustomerIdInDb.mockResolvedValue('company-1');
    getSubscriptionDataInDb.mockResolvedValue(null);
    upsertSubscriptionInDb.mockResolvedValue(undefined);
    retrieveStripeSubscription.mockResolvedValue(stripeSubscription());
  });

  it('returns a generic 400 on a bad signature without echoing the error', async () => {
    stripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = await run();

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.message).not.toMatch(/signatures found/);
    expect(upsertSubscriptionInDb).not.toHaveBeenCalled();
  });

  it.each(['paid', 'no_payment_required'])('stores the retrieved subscription and its item period end on checkout.session.completed (%s)', async (paymentStatus) => {
    getSubscriptionDataInDb.mockResolvedValue({ id: 'trial-uuid', expires_at: FUTURE });
    givenEvent('checkout.session.completed', {
      id: 'cs_1',
      payment_status: paymentStatus,
      subscription: 'sub_new',
      client_reference_id: 'company-1',
    });

    const res = await run();

    expect(retrieveStripeSubscription).toHaveBeenCalledWith('sub_new');
    expect(getCompanyIdByStripeCustomerIdInDb).not.toHaveBeenCalled();
    expect(upsertSubscriptionInDb).toHaveBeenCalledWith({
      companyId: 'company-1',
      subscriptionId: 'sub_new',
      expiresAt: new Date(PERIOD_END * 1000),
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('skips checkout.session.completed while the payment is still unpaid (async methods)', async () => {
    givenEvent('checkout.session.completed', {
      id: 'cs_1',
      payment_status: 'unpaid',
      subscription: 'sub_new',
      client_reference_id: 'company-1',
    });

    const res = await run();

    expect(retrieveStripeSubscription).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('stores the subscription on checkout.session.async_payment_succeeded', async () => {
    givenEvent('checkout.session.async_payment_succeeded', {
      id: 'cs_1',
      payment_status: 'paid',
      subscription: 'sub_new',
      client_reference_id: 'company-1',
    });

    await run();

    expect(upsertSubscriptionInDb).toHaveBeenCalledWith(expect.objectContaining({ subscriptionId: 'sub_new' }));
  });

  it('falls back to the top-level current_period_end for older API versions', async () => {
    retrieveStripeSubscription.mockResolvedValue(stripeSubscription({
      items: { data: [] },
      current_period_end: PERIOD_END,
    }));
    givenEvent('customer.subscription.updated', { id: 'sub_new' });

    await run();

    expect(upsertSubscriptionInDb).toHaveBeenCalledWith(expect.objectContaining({ expiresAt: new Date(PERIOD_END * 1000) }));
  });

  it('renews expires_at on invoice.paid using the invoice parent subscription', async () => {
    getSubscriptionDataInDb.mockResolvedValue({ id: 'sub_new', expires_at: PAST });
    givenEvent('invoice.paid', {
      id: 'in_1',
      parent: { subscription_details: { subscription: 'sub_new' } },
    });

    await run();

    expect(getCompanyIdByStripeCustomerIdInDb).toHaveBeenCalledWith('cus_1');
    expect(upsertSubscriptionInDb).toHaveBeenCalledWith({
      companyId: 'company-1',
      subscriptionId: 'sub_new',
      expiresAt: new Date(PERIOD_END * 1000),
    });
  });

  it('ignores invoices that do not belong to a subscription', async () => {
    givenEvent('invoice.paid', { id: 'in_1', parent: null });

    const res = await run();

    expect(retrieveStripeSubscription).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('keeps the row and expires it on customer.subscription.deleted', async () => {
    const endedAt = 1700000000;
    getSubscriptionDataInDb.mockResolvedValue({ id: 'sub_new', expires_at: FUTURE });
    retrieveStripeSubscription.mockResolvedValue(stripeSubscription({ status: 'canceled', ended_at: endedAt }));
    givenEvent('customer.subscription.deleted', { id: 'sub_new' });

    await run();

    expect(upsertSubscriptionInDb).toHaveBeenCalledWith({
      companyId: 'company-1',
      subscriptionId: 'sub_new',
      expiresAt: new Date(endedAt * 1000),
    });
  });

  it('expires the subscription immediately when it becomes unpaid', async () => {
    getSubscriptionDataInDb.mockResolvedValue({ id: 'sub_new', expires_at: FUTURE });
    retrieveStripeSubscription.mockResolvedValue(stripeSubscription({ status: 'unpaid' }));
    givenEvent('customer.subscription.updated', { id: 'sub_new' });

    const before = Date.now();
    await run();

    const { expiresAt } = upsertSubscriptionInDb.mock.calls[0][0];
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('ignores a stale event for another subscription while the stored one is active', async () => {
    getSubscriptionDataInDb.mockResolvedValue({ id: 'sub_current', expires_at: FUTURE });
    retrieveStripeSubscription.mockResolvedValue(stripeSubscription({ id: 'sub_old', status: 'active' }));
    givenEvent('customer.subscription.updated', { id: 'sub_old' });

    const res = await run();

    expect(upsertSubscriptionInDb).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('does not let a canceled old subscription overwrite a trial row', async () => {
    getSubscriptionDataInDb.mockResolvedValue({ id: 'trial-uuid', expires_at: FUTURE });
    retrieveStripeSubscription.mockResolvedValue(stripeSubscription({ id: 'sub_old', status: 'canceled', ended_at: 1700000000 }));
    givenEvent('customer.subscription.deleted', { id: 'sub_old' });

    await run();

    expect(upsertSubscriptionInDb).not.toHaveBeenCalled();
  });

  it('lets a resubscription replace an ended stored subscription', async () => {
    getSubscriptionDataInDb.mockResolvedValue({ id: 'sub_old', expires_at: PAST });
    givenEvent('checkout.session.completed', {
      id: 'cs_2',
      payment_status: 'paid',
      subscription: 'sub_new',
      client_reference_id: 'company-1',
    });

    await run();

    expect(upsertSubscriptionInDb).toHaveBeenCalledWith(expect.objectContaining({ subscriptionId: 'sub_new' }));
  });

  it('acknowledges events for an unknown Stripe customer without writing', async () => {
    getCompanyIdByStripeCustomerIdInDb.mockResolvedValue(null);
    givenEvent('customer.subscription.updated', { id: 'sub_new' });

    const res = await run();

    expect(upsertSubscriptionInDb).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it.each(['P2003', 'P2025'])('returns 200 with a warning when the company was deleted (%s)', async (code) => {
    upsertSubscriptionInDb.mockRejectedValue(Object.assign(new Error('prisma'), { code }));
    givenEvent('checkout.session.completed', {
      id: 'cs_1',
      payment_status: 'paid',
      subscription: 'sub_new',
      client_reference_id: 'deleted-company',
    });

    const res = await run();

    expect(logWarn).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 on other DB failures so Stripe retries', async () => {
    upsertSubscriptionInDb.mockRejectedValue(new Error('connection lost'));
    givenEvent('customer.subscription.updated', { id: 'sub_new' });

    const res = await run();

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
