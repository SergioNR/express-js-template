//* Express `trust proxy` setting, read from TRUST_PROXY. It decides which
//* X-Forwarded-* hops are believed for req.ip / req.protocol, so a wrong value
//* either lets clients spoof their IP (bypassing rate limits) or makes every
//* client share the proxy's IP. It must be set explicitly outside localhost.
//*
//* Accepted values:
//*   - a number of hops (e.g. `1` for a single reverse proxy / load balancer)
//*   - `false` (no proxy - the app is reached directly)
//*   - a comma-separated list of addresses/subnets or express presets
//*     (e.g. `loopback, 10.0.0.0/8`)

export const parseTrustProxy = (value) => {
  const trimmed = String(value).trim();

  if (trimmed === '') {
    return null;
  }

  if (trimmed.toLowerCase() === 'false') {
    return false;
  }

  //* `true` trusts every hop, which lets any client forge X-Forwarded-For
  if (trimmed.toLowerCase() === 'true') {
    throw new Error('TRUST_PROXY=true trusts any X-Forwarded-For value - use a hop count or a subnet list instead');
  }

  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }

  return trimmed.split(',').map((entry) => entry.trim()).filter(Boolean);
};

export const resolveTrustProxy = (env = process.env) => {
  const parsed = env.TRUST_PROXY === undefined ? null : parseTrustProxy(env.TRUST_PROXY);

  if (parsed !== null) {
    return parsed;
  }

  if (env.DEPLOY_ENVIRONMENT === 'localhost') {
    return false;
  }

  throw new Error('TRUST_PROXY environment variable is not set - refusing to start without an explicit reverse proxy configuration');
};

export const trustProxySetting = resolveTrustProxy();
