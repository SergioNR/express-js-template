import { CronJob } from 'cron';
import { logError, logInfo } from '../config/loggerFunctions.js';
import {
  deletePendingFilesByKeysInDb,
  getStalePendingFileKeysInDb,
} from '../models/pendingFileUploadsModel.js';
import { deleteS3Objects } from '../integrations/s3/deleteS3Objects.js';

//* Presigned upload URLs live for minutes - a row still pending after an
//* hour belongs to an upload that was abandoned or never confirmed
export const PENDING_FILE_MAX_AGE_MS = 60 * 60 * 1000;

//* Bucket first, catalog second: a row is only dropped once its object is
//* confirmed gone, so a failed bucket delete keeps the row and the next tick
//* retries it instead of silently orphaning the object. The window between
//* the key listing and the bucket delete cannot race a late confirm: the
//* presigned URL expired long before the one-hour staleness threshold, and
//* the row delete is additionally filtered on `pending`
export const deletePendingFileUploads = async () => {
  const staleKeys = await getStalePendingFileKeysInDb(new Date(Date.now() - PENDING_FILE_MAX_AGE_MS));

  if (staleKeys.length === 0) {
    return;
  }

  const { failedKeys } = await deleteS3Objects(staleKeys);

  if (failedKeys.length > 0) {
    logError(
      `Could not delete ${failedKeys.length} of ${staleKeys.length} stale pending upload object(s) from the bucket - their rows are kept for the next run`,
      new Error('S3 batch delete reported failed keys'),
      { failedKeys },
    );
  }

  const failedKeySet = new Set(failedKeys);
  const deletedKeys = staleKeys.filter((key) => !failedKeySet.has(key));

  const deletedRowCount = await deletePendingFilesByKeysInDb(deletedKeys);

  logInfo(`Deleted ${deletedRowCount} stale pending file upload(s)`);
};

//* waitForCompletion: an in-flight tick (slow bucket delete) is never
//* overlapped by the next one, so two runs cannot race on the same keys
export const deletePendingFileUploadsScheduler = CronJob.from({
  cronTime: '*/15 * * * *',
  onTick: async () => {
    try {
      await deletePendingFileUploads();
    } catch (error) {
      logError('Error deleting stale pending file uploads:', error);
    }
  },
  waitForCompletion: true,
});
