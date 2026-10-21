//* Single source of truth for the browser origins allowed to call the API.
//* Shared by the CORS middleware and the Origin/Referer CSRF check so both
//* always agree on which front-ends are trusted.

const LOCALHOST_ORIGINS = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Common React dev server
  'http://localhost:8080', // Common dev ports
];

//* Origins are compared as `scheme://host[:port]` (what browsers send in the
//* Origin header), so a trailing slash or path in the env var is dropped
export const toOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const buildAllowedOrigins = (env = process.env) => {
  const isLocalhost = env.DEPLOY_ENVIRONMENT === 'localhost';
  const frontOrigin = env.FRONT_WEB_APP_ORIGIN_URL ? toOrigin(env.FRONT_WEB_APP_ORIGIN_URL) : null;

  if (!isLocalhost && !frontOrigin) {
    throw new Error('FRONT_WEB_APP_ORIGIN_URL environment variable is not set or is not a valid URL - refusing to start without a CORS allowlist');
  }

  //* Dev-server origins are only trusted on local development - never in a
  //* deployed environment where any local process could otherwise forge requests
  const origins = [frontOrigin, ...(isLocalhost ? LOCALHOST_ORIGINS : [])].filter(Boolean);

  return [...new Set(origins)];
};

export const allowedOrigins = buildAllowedOrigins();
