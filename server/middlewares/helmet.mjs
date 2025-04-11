import helmet from 'helmet';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Controls the allowed content type(eg scripts, styles, imgs, etc.)
});
