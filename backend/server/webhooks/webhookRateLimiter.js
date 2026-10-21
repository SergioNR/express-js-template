import rateLimit from 'express-rate-limit';
import { logRateLimited } from '../config/loggerFunctions.js';

//* The global limiter is skipped for /webhooks so Stripe retries are never
//* throttled, which left the endpoint without any ceiling. This budget is far
//* above anything Stripe sends from a single IP but caps what an attacker
//* can push through signature verification per minute
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res /* , next, options */) => {
    logRateLimited(req);
    res.status(429).json({
      message: 'Too many requests - please try again later',
    });
  },
});
