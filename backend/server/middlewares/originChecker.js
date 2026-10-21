import { allowedOrigins, toOrigin } from '../config/allowedOrigins.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

//* The session cookie is SameSite=None outside localhost, so the browser
//* attaches it to cross-site requests. Rejecting state-changing requests whose
//* Origin (or Referer, when a browser omits Origin) is not an allowed front-end
//* blocks CSRF. Mounted after /webhooks so Stripe (no Origin header) is unaffected.
const getRequestOrigin = (req) => {
  const origin = req.get('origin');

  if (origin) {
    //* Sandboxed / privacy-sensitive contexts send the literal string "null"
    return origin === 'null' ? null : toOrigin(origin);
  }

  const referer = req.get('referer');

  return referer ? toOrigin(referer) : null;
};

export const checkOrigin = (origins = allowedOrigins) => {
  const trustedOrigins = new Set(origins);

  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const requestOrigin = getRequestOrigin(req);

    //* Same-origin requests (e.g. Swagger UI served by this API) are trusted too
    const selfOrigin = `${req.protocol}://${req.get('host')}`;

    if (requestOrigin && (trustedOrigins.has(requestOrigin) || requestOrigin === selfOrigin)) {
      return next();
    }

    return res.status(403).json({
      message: 'Request origin is not allowed',
    });
  };
};
