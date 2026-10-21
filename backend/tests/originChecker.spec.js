import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/config/allowedOrigins.js', () => ({
  allowedOrigins: ['https://app.example.com'],
  toOrigin: (value) => {
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  },
}));

const { checkOrigin } = await import('../server/middlewares/originChecker.js');

const createMockReq = ({ method = 'POST', headers = {}, protocol = 'https' } = {}) => {
  const lowerCaseHeaders = Object.fromEntries(
    Object.entries({ host: 'api.example.com', ...headers }).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    method,
    protocol,
    get: (name) => lowerCaseHeaders[name.toLowerCase()],
  };
};

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('checkOrigin', () => {
  const middleware = checkOrigin();

  it.each(['GET', 'HEAD', 'OPTIONS'])('lets safe %s requests through without an Origin', (method) => {
    const next = jest.fn();

    middleware(createMockReq({ method }), createMockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('accepts state-changing requests from an allowed Origin', () => {
    const next = jest.fn();

    middleware(createMockReq({ headers: { Origin: 'https://app.example.com' } }), createMockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects state-changing requests from a foreign Origin with 403', () => {
    const next = jest.fn();
    const res = createMockRes();

    middleware(createMockReq({ method: 'DELETE', headers: { Origin: 'https://evil.example' } }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Request origin is not allowed' });
  });

  it('falls back to the Referer origin when Origin is missing', () => {
    const next = jest.fn();

    middleware(createMockReq({ headers: { Referer: 'https://app.example.com/user/settings?tab=1' } }), createMockRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects a foreign Referer when Origin is missing', () => {
    const res = createMockRes();

    middleware(createMockReq({ headers: { Referer: 'https://evil.example/page' } }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects requests with neither Origin nor Referer', () => {
    const res = createMockRes();

    middleware(createMockReq({ method: 'PATCH' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects the opaque "null" Origin', () => {
    const res = createMockRes();

    middleware(createMockReq({ headers: { Origin: 'null', Referer: 'https://app.example.com/' } }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('does not accept look-alike origins by prefix', () => {
    const res = createMockRes();

    middleware(createMockReq({ headers: { Origin: 'https://app.example.com.evil.example' } }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('accepts same-origin requests to the API itself (Swagger UI)', () => {
    const next = jest.fn();

    middleware(createMockReq({ headers: { Origin: 'https://api.example.com' } }), createMockRes(), next);

    expect(next).toHaveBeenCalled();
  });
});
