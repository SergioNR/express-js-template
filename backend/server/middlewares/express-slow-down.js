import { slowDown } from 'express-slow-down';

const DELAY_STEP_MS = 100;

export const slowLimiter = slowDown({
  windowMs: 5 * 60 * 1000, // 5 minutes
  delayAfter: 30, // Allow 30 requests per windowMs before starting to slow down
  //* `used` counts every request in the window, so the delay is computed
  //* relative to delayAfter (otherwise request 31 would already wait 3.1s)
  delayMs: (used, req) => (used - req.slowDown.limit) * DELAY_STEP_MS,
  maxDelayMs: 2000, // Never hold a request for more than 2 seconds
  /* Explanation:
      *
      * - requests 1-30 are not delayed.
      * - request 31 is delayed by 100ms
      * - request 32 is delayed by 200ms
      * - request 33 is delayed by 300ms
      * - request 50 and later are delayed by the 2000ms cap
      *
      * and so on. After 5 minutes, the delay is reset to 0.
  */
});
