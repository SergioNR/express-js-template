import { Router } from 'express';
import { checkSchema } from 'express-validator';
import {
  createCompanyBillingId,
  getBillingCustomerPortalUrl,
  getBillingCheckoutSessionUrl,
  getCompanySubscriptionData,
} from '../../../controllers/billingController.js';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.js';
import { checkoutSessionSchema } from '../../../utils/validators/checkoutSessionSchema.js';

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
 *                 subscriptionData:
 *                   type: object
 *                   description: Subscription fields only - internal Stripe ids are never exposed
 *                   properties:
 *                     id:
 *                       type: string
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     has_billing_id:
 *                       type: boolean
 *                       description: Whether the company has a Stripe customer id - false until the first checkout session is started
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: No subscription found for the company
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
 *       201:
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
 *       404:
 *         description: No subscription found for the company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: Company already has a billing id
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
 *                 enum: [basic, pro]
 *                 description: Name of the plan to subscribe to
 *               planBillingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 description: Billing cycle of the plan
 *     responses:
 *       200:
 *         description: Checkout session URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutSessionUrl:
 *                   type: string
 *                   format: uri
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: No subscription found for the company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors - unknown plan or billing cycle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
billingRouter.post('/checkout-session', checkSchema(checkoutSessionSchema), sanitizerResult, getBillingCheckoutSessionUrl);

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
 *                 customerPortalUrl:
 *                   type: string
 *                   format: uri
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: No subscription found for the company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       409:
 *         description: Company has no billing id yet - start a checkout first
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
billingRouter.post('/customer-portal', getBillingCustomerPortalUrl);

billingRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
