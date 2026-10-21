import rateLimit from 'express-rate-limit';
import { logRateLimited } from '../config/loggerFunctions.js';

//* Per-account brute-force guard for login, keyed by the normalized email
//* (`username`) instead of the IP, so distributed attacks against a single
//* account are throttled too. Only failed attempts count (successful logins
//* are skipped). Must run after the login validator so the email is normalized.
export const loginAccountKey = (req) => `login:${String(req.body?.username ?? '').trim().toLowerCase()}`;

export const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 failed login attempts per account per window
  skipSuccessfulRequests: true,
  keyGenerator: loginAccountKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res /* , next, options */) => {
    logRateLimited(req);
    res.status(429).json({
      message: 'Too many failed login attempts for this account - please try again later',
    });
  },
});
