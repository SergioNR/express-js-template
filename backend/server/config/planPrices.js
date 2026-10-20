const FALLBACK_PRICE_ID = process.env.STRIPE_PRICE_ID;

//* Maps a (planName, planBillingCycle) pair to the Stripe price id configured
//* in the environment. Falls back to STRIPE_PRICE_ID when no plan-specific
//* override exists so single-plan deployments keep working unchanged.
const PLAN_PRICE_MAP = {
  basic: {
    monthly: process.env.STRIPE_PRICE_ID_BASIC_MONTHLY || FALLBACK_PRICE_ID,
    yearly: process.env.STRIPE_PRICE_ID_BASIC_YEARLY || FALLBACK_PRICE_ID,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || FALLBACK_PRICE_ID,
    yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || FALLBACK_PRICE_ID,
  },
};

export const SUPPORTED_PLANS = Object.keys(PLAN_PRICE_MAP);

export const SUPPORTED_BILLING_CYCLES = ['monthly', 'yearly'];

export const getStripePriceId = (planName, planBillingCycle) => {
  const priceId = PLAN_PRICE_MAP[planName]?.[planBillingCycle];

  if (!priceId) {
    throw new Error(`No Stripe price id configured for plan "${planName}" (${planBillingCycle})`);
  }

  return priceId;
};
