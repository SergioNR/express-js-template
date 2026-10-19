import { Router } from 'express';
import {
  createCompanyBillingId,
  getBillingCustomerPortalUrl,
  getBillingCheckoutSessionUrl,
  getCompanySubscriptionData,
} from '../../../controllers/billingController.js';

export const billingRouter = Router();

/**
 * @openapi
 * /api/v1/billing:
 *   get:
 *     tags: [Billing]
 *     summary: Get the subscription data of the user's company
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Subscription data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscriptionData:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
billingRouter.get('/', getCompanySubscriptionData);

/**
 * @openapi
 * /api/v1/billing:
 *   post:
 *     tags: [Billing]
 *     summary: Create a Stripe customer for the user's company
 *     description: Creates a Stripe customer id for the logged-in user's company and stores it. Fails if the company already has a billing id.
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Billing id created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       500:
 *         description: Company already has a billing id or Stripe request failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
billingRouter.post('/', createCompanyBillingId);

/**
 * @openapi
 * /api/v1/billing/checkout-session:
 *   post:
 *     tags: [Billing]
 *     summary: Create a Stripe checkout session
 *     description: Creates a Stripe checkout session for the user's company and returns its URL for redirecting the user.
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planName:
 *                 type: string
 *                 description: Name of the plan to subscribe to
 *               planBillingCycle:
 *                 type: string
 *                 description: Billing cycle of the plan
 *     responses:
 *       200:
 *         description: Checkout session URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 checkoutSessionUrl:
 *                   type: string
 *                   format: uri
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       500:
 *         description: Checkout session could not be created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
billingRouter.post('/checkout-session', getBillingCheckoutSessionUrl);

/**
 * @openapi
 * /api/v1/billing/customer-portal:
 *   post:
 *     tags: [Billing]
 *     summary: Create a Stripe customer portal session
 *     description: Creates a Stripe customer portal session for the user's company and returns its URL for managing the subscription.
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Customer portal URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                 message:
 *                   type: string
 *                 customerPortalUrl:
 *                   type: string
 *                   format: uri
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       500:
 *         description: Customer portal session could not be created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
billingRouter.post('/customer-portal', getBillingCustomerPortalUrl);

billingRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
