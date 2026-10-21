import { jest } from '@jest/globals';

const rateLimitMock = jest.fn((options) => options);
const slowDownMock = jest.fn((options) => options);

jest.unstable_mockModule('express-rate-limit', () => ({
  default: rateLimitMock,
}));

jest.unstable_mockModule('express-slow-down', () => ({
  slowDown: slowDownMock,
}));

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logRateLimited: jest.fn(),
}));

const { loginAccountLimiter, loginAccountKey } = await import('../server/middlewares/loginAccountRateLimiter.js');
const { slowLimiter } = await import('../server/middlewares/express-slow-down.js');

describe('loginAccountLimiter', () => {
  it('allows 5 failed attempts per account per 15 minutes and skips successful logins', () => {
    expect(loginAccountLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(loginAccountLimiter.limit).toBe(5);
    expect(loginAccountLimiter.skipSuccessfulRequests).toBe(true);
  });

  it('keys on the normalized username, not the IP', () => {
    const keyA = loginAccountKey({ ip: '203.0.113.1', body: { username: ' User@Example.com ' } });
    const keyB = loginAccountKey({ ip: '198.51.100.2', body: { username: 'user@example.com' } });

    expect(keyA).toBe(keyB);
    expect(keyA).toBe('login:user@example.com');
  });

  it('responds 429 when the account budget is exhausted', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    loginAccountLimiter.handler({ ip: '203.0.113.7' }, res);

    expect(res.status).toHaveBeenCalledWith(429);
  });
});

describe('slowLimiter', () => {
  it('delays relative to delayAfter and caps the delay', () => {
    const req = { slowDown: { limit: slowLimiter.delayAfter } };

    expect(slowLimiter.delayMs(31, req)).toBe(100);
    expect(slowLimiter.delayMs(35, req)).toBe(500);
    expect(slowLimiter.maxDelayMs).toBe(2000);
  });
});
