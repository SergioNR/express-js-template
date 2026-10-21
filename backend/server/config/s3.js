import { S3Client } from '@aws-sdk/client-s3';

//* S3-compatible storage singleton. The whole files feature is an optional
//* feature flag: when S3_BUCKET is unset the files router is never mounted
//* and the server boots normally without any storage dependency.

const DEFAULT_MAX_FILE_SIZE_MB = 50;

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const isS3Configured = () => Boolean(process.env.S3_BUCKET);

if (isS3Configured()) {
  const requiredVars = ['S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`S3_BUCKET is set but ${missingVars.join(', ')} are missing - refusing to start with a misconfigured S3 client`);
  }
}

export const { S3_BUCKET } = process.env;

export const s3Client = isS3Configured()
  ? new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false', //* Path-style by default so MinIO-compatible endpoints work out of the box
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  })
  : null;

export const S3_MAX_FILE_SIZE_BYTES = (Number.parseInt(process.env.S3_MAX_FILE_SIZE_MB, 10) || DEFAULT_MAX_FILE_SIZE_MB) * 1024 * 1024;

export const S3_ALLOWED_MIME_TYPES = (process.env.S3_ALLOWED_MIME_TYPES
  ? process.env.S3_ALLOWED_MIME_TYPES.split(',').map((mimeType) => mimeType.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_MIME_TYPES);

//* Presigned URLs are throwaway - short TTLs, regenerated on every request
export const S3_UPLOAD_URL_TTL_SECONDS = 300;
export const S3_DOWNLOAD_URL_TTL_SECONDS = 600;
