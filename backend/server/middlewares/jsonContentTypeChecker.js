//* The API only speaks JSON. Rejecting any other body type means a cross-site
//* HTML form (urlencoded / multipart / text/plain - "simple" requests that skip
//* the CORS preflight) can never reach a controller. File uploads go straight
//* to S3 through presigned URLs, so no API route accepts multipart.
const hasBody = (req) => {
  if (req.get('transfer-encoding') !== undefined) {
    return true;
  }

  const contentLength = Number.parseInt(req.get('content-length'), 10);

  return Number.isInteger(contentLength) && contentLength > 0;
};

export const checkJsonContentType = () => (req, res, next) => {
  if (!hasBody(req) || req.is('application/json')) {
    return next();
  }

  return res.status(415).json({
    message: 'Request body must be sent as application/json',
  });
};
