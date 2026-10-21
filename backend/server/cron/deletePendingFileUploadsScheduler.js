import { CronJob } from 'cron';
import { logError, logInfo } from '../config/loggerFunctions.js';
import { deleteStalePendingFilesInDb } from '../models/filesModel.js';
import { deleteS3Objects } from '../integrations/s3/deleteS3Objects.js';

//* Presigned upload URLs live for minutes - a row still pending after an
//* hour belongs to an upload that was abandoned or never confirmed
export const PENDING_FILE_MAX_AGE_MS = 60 * 60 * 1000;

export const deletePendingFileUploads = async () => {
  //* Rows are deleted first (atomically returning their keys), so an object
  //* is only removed once no catalog entry can reference it anymore
  const staleKeys = await deleteStalePendingFilesInDb(new Date(Date.now() - PENDING_FILE_MAX_AGE_MS));

  if (staleKeys.length === 0) {
    return;
  }

  await deleteS3Objects(staleKeys);

  logInfo(`Deleted ${staleKeys.length} stale pending file upload(s)`);
};

export const deletePendingFileUploadsScheduler = new CronJob(
  '*/15 * * * *',
  async () => {
    try {
      await deletePendingFileUploads();
    } catch (error) {
      logError('Error deleting stale pending file uploads:', error);
    }
  },
);
