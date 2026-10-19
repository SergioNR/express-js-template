import { slowDown } from 'express-slow-down';

export const slowLimiter = slowDown({
  windowMs: 5 * 60 * 1000, // 5 minutes
  delayAfter: 30, // Allow 30 requests per windowMs before starting to slow down.
  delayMs: (hits) => hits * 100, // Add 100 ms of delay to every request after the 5th one.
  /* Explanation:
      *
      * - requests 1-10 are not delayed.
      * - request 11 is delayed by 600ms
      * - request 12 is delayed by 700ms
      * - request 13 is delayed by 800ms
      *
      * and so on. After 5 minutes, the delay is reset to 0.
  */
});
