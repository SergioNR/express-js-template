import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET, S3_DOWNLOAD_URL_TTL_SECONDS, s3Client } from '../../config/s3.js';
import { sanitizeFilename } from '../../utils/s3Key.js';

//* Fresh short-lived presigned GET per download request - URLs are never
//* stored; once expired the client simply asks the API for a new one.
//* The response headers are pinned into the signature: `attachment` keeps the
//* browser from rendering the object inline on the bucket origin, and the
//* content type comes from the catalog row (verified at confirm time), never
//* from whatever metadata the object carries
export const presignGetObject = async (s3Key, options = {}) => {
  const { filename, contentType } = options;

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ...(filename ? { ResponseContentDisposition: `attachment; filename="${sanitizeFilename(filename)}"` } : {}),
    ...(contentType ? { ResponseContentType: contentType } : {}),
  });

  return getSignedUrl(s3Client, command, { expiresIn: S3_DOWNLOAD_URL_TTL_SECONDS });
};
