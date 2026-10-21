import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { S3_BUCKET, isS3Configured, s3Client } from '../../config/s3.js';
import { logWarn } from '../../config/loggerFunctions.js';

//* DeleteObjects caps at 1000 keys per call
const MAX_KEYS_PER_BATCH = 1000;

//* Best-effort batch delete - missing keys are a success, provider outages are
//* logged and swallowed so cleanup callers never flip a finished flow into a 500.
//* Orphaned objects are harmless: the database is the source of truth.
export const deleteS3Objects = async (s3Keys) => {
  if (!isS3Configured() || s3Keys.length === 0) {
    return { deletedCount: 0, failedKeys: [] };
  }

  const batches = [];

  for (let index = 0; index < s3Keys.length; index += MAX_KEYS_PER_BATCH) {
    batches.push(s3Keys.slice(index, index + MAX_KEYS_PER_BATCH));
  }

  const failedKeys = [];
  let deletedCount = 0;

  for (const batch of batches) {
    try {
      const response = await s3Client.send(new DeleteObjectsCommand({
        Bucket: S3_BUCKET,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }));

      deletedCount += batch.length - (response.Errors?.length ?? 0);
      failedKeys.push(...(response.Errors ?? []).map((deletionError) => deletionError.Key));
    } catch (error) {
      logWarn(`S3 batch delete failed for ${batch.length} object(s)`, error, { bucket: S3_BUCKET });
      failedKeys.push(...batch);
    }
  }

  return { deletedCount, failedKeys };
};
