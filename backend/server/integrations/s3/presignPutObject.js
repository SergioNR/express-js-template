import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET, S3_UPLOAD_URL_TTL_SECONDS, s3Client } from '../../config/s3.js';

//* Short-lived presigned PUT. The client uploads the bytes straight to the
//* bucket; the server never carries file payloads. Content-Type is signed so
//* the upload must be sent with the exact declared MIME type.
export const presignPutObject = async (s3Key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: S3_UPLOAD_URL_TTL_SECONDS });
};
