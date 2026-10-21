import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/models/filesModel.js', () => ({
  deleteStalePendingFilesInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/integrations/s3/deleteS3Objects.js', () => ({
  deleteS3Objects: jest.fn(),
}));

jest.unstable_mockModule('../server/config/loggerFunctions.js', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

const {
  PENDING_FILE_MAX_AGE_MS,
  deletePendingFileUploads,
} = await import('../server/cron/deletePendingFileUploadsScheduler.js');
const { deleteStalePendingFilesInDb } = await import('../server/models/filesModel.js');
const { deleteS3Objects } = await import('../server/integrations/s3/deleteS3Objects.js');

describe('deletePendingFileUploads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes pending rows older than one hour, then their objects', async () => {
    deleteStalePendingFilesInDb.mockResolvedValue(['company-1/file-1/a.pdf']);
    const before = Date.now();

    await deletePendingFileUploads();

    const [cutoff] = deleteStalePendingFilesInDb.mock.calls[0];
    expect(PENDING_FILE_MAX_AGE_MS).toBe(3600000);
    expect(cutoff.getTime()).toBeLessThanOrEqual(before - PENDING_FILE_MAX_AGE_MS + 1000);
    expect(deleteS3Objects).toHaveBeenCalledWith(['company-1/file-1/a.pdf']);
    expect(deleteStalePendingFilesInDb.mock.invocationCallOrder[0]).toBeLessThan(deleteS3Objects.mock.invocationCallOrder[0]);
  });

  it('skips the bucket when nothing is stale', async () => {
    deleteStalePendingFilesInDb.mockResolvedValue([]);

    await deletePendingFileUploads();

    expect(deleteS3Objects).not.toHaveBeenCalled();
  });
});
