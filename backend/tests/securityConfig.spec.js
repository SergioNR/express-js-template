//* Both config modules evaluate process.env at import time - give them a valid
//* environment so the module-level fail-fast checks pass on import
process.env.TRUST_PROXY = process.env.TRUST_PROXY ?? '1';
process.env.FRONT_WEB_APP_ORIGIN_URL = process.env.FRONT_WEB_APP_ORIGIN_URL ?? 'https://app.example.com';

const { buildAllowedOrigins } = await import('../server/config/allowedOrigins.js');
const { parseTrustProxy, resolveTrustProxy } = await import('../server/config/trustProxy.js');

describe('buildAllowedOrigins', () => {
  it('only allows the front-end origin outside localhost', () => {
    expect(buildAllowedOrigins({
      DEPLOY_ENVIRONMENT: 'production',
      FRONT_WEB_APP_ORIGIN_URL: 'https://app.example.com/',
    })).toEqual(['https://app.example.com']);
  });

  it('adds the dev-server origins on localhost', () => {
    const origins = buildAllowedOrigins({ DEPLOY_ENVIRONMENT: 'localhost' });

    expect(origins).toContain('http://localhost:5173');
  });

  it('fails fast outside localhost when FRONT_WEB_APP_ORIGIN_URL is missing or invalid', () => {
    expect(() => buildAllowedOrigins({ DEPLOY_ENVIRONMENT: 'production' })).toThrow('FRONT_WEB_APP_ORIGIN_URL');
    expect(() => buildAllowedOrigins({ DEPLOY_ENVIRONMENT: 'production', FRONT_WEB_APP_ORIGIN_URL: 'not a url' })).toThrow();
  });
});

describe('trust proxy configuration', () => {
  it('parses hop counts, false and subnet lists', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('false')).toBe(false);
    expect(parseTrustProxy('loopback, 10.0.0.0/8')).toEqual(['loopback', '10.0.0.0/8']);
  });

  it('refuses TRUST_PROXY=true', () => {
    expect(() => parseTrustProxy('true')).toThrow();
  });

  it('is required outside localhost and defaults to false on localhost', () => {
    expect(() => resolveTrustProxy({ DEPLOY_ENVIRONMENT: 'production' })).toThrow('TRUST_PROXY');
    expect(resolveTrustProxy({ DEPLOY_ENVIRONMENT: 'localhost' })).toBe(false);
    expect(resolveTrustProxy({ DEPLOY_ENVIRONMENT: 'production', TRUST_PROXY: '2' })).toBe(2);
  });
});
