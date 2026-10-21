//* Single source of truth for rendering plan prices (amounts live in
//* src/config/plans.js) - the UI copy never hardcodes a price
//* Whole amounts render without decimals (29 €); fractional ones always get
//* two (29,50 € - never 29,5 €)
export const formatPrice = (amount, currency) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatPlanPrice = (plan) => formatPrice(plan.price, plan.currency);
