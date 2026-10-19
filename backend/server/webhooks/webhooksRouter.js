import express from 'express';
import { stripeEventHandler } from './stripe/stripeEventHandler.js';

export const webhookRouter = express.Router();

/**
 * @openapi
 * /webhooks/v1/stripe:
 *   post:
 *     tags: [Webhooks]
 *     summary: Stripe webhook receiver
 *     description: Receives Stripe event webhooks. The raw JSON body is read as-is and the `stripe-signature` header is verified against `STRIPE_WEBHOOK_SECRET`. Intended for Stripe's servers only — not for client consumption.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           description: Raw Stripe event payload (must not be modified, the signature is computed over the exact bytes)
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe webhook signature header
 *     responses:
 *       200:
 *         description: Event received and processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Invalid payload or webhook signature verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 */
webhookRouter.post('/v1/stripe', express.raw({ type: 'application/json' }), stripeEventHandler);

webhookRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  });
});
