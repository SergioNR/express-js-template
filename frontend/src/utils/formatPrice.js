//* Single source of truth for rendering plan prices (amounts live in
//* src/config/plans.js) - the UI copy never hardcodes a price
export const formatPrice = (amount, currency) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatPlanPrice = (plan) => formatPrice(plan.price, plan.currency);
