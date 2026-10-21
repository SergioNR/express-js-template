import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET, S3_UPLOAD_URL_TTL_SECONDS, s3Client } from '../../config/s3.js';

//* Short-lived presigned PUT. The client uploads the bytes straight to the
//* bucket; the server never carries file payloads. Content-Type and
//* Content-Length are signed so the upload must be sent with the exact
//* declared MIME type and size (the confirm endpoint re-verifies both)
export const presignPutObject = async (s3Key, contentType, sizeBytes) => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: contentType,
    ContentLength: sizeBytes,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: S3_UPLOAD_URL_TTL_SECONDS,
    //* Force content-length into the signed headers - the presigner hoists
    //* unsigned headers into the query string by default
    signableHeaders: new Set(['content-type', 'content-length']),
  });
};
