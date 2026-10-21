import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET, S3_DOWNLOAD_URL_TTL_SECONDS, s3Client } from '../../config/s3.js';

//* Fresh short-lived presigned GET per download request - URLs are never
//* stored; once expired the client simply asks the API for a new one.
export const presignGetObject = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: S3_DOWNLOAD_URL_TTL_SECONDS });
};
