import express from 'express';
import { stripeEventHandler } from './stripe/stripeEventHandler.js';

export const webhookRouter = express.Router();

webhookRouter.post('/v1/stripe', express.raw({ type: 'application/json' }), stripeEventHandler);

webhookRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  });
});
