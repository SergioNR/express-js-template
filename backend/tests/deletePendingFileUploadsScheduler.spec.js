import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/models/pendingFileUploadsModel.js', () => ({
  getStalePendingFileKeysInDb: jest.fn(),
  deletePendingFilesByKeysInDb: jest.fn(),
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
const {
  getStalePendingFileKeysInDb,
  deletePendingFilesByKeysInDb,
} = await import('../server/models/pendingFileUploadsModel.js');
const { deleteS3Objects } = await import('../server/integrations/s3/deleteS3Objects.js');
const { logError } = await import('../server/config/loggerFunctions.js');

const KEY_A = 'company-1/file-1/a.pdf';
const KEY_B = 'company-1/file-2/b.pdf';

describe('deletePendingFileUploads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deleteS3Objects.mockResolvedValue({ deletedCount: 0, failedKeys: [] });
    deletePendingFilesByKeysInDb.mockImplementation(async (keys) => keys.length);
  });

  it('lists pending rows older than one hour, deletes their objects, then the rows', async () => {
    getStalePendingFileKeysInDb.mockResolvedValue([KEY_A]);
    deleteS3Objects.mockResolvedValue({ deletedCount: 1, failedKeys: [] });
    const before = Date.now();

    await deletePendingFileUploads();

    const [cutoff] = getStalePendingFileKeysInDb.mock.calls[0];
    expect(PENDING_FILE_MAX_AGE_MS).toBe(3600000);
    expect(cutoff.getTime()).toBeLessThanOrEqual(before - PENDING_FILE_MAX_AGE_MS + 1000);
    expect(deleteS3Objects).toHaveBeenCalledWith([KEY_A]);
    expect(deletePendingFilesByKeysInDb).toHaveBeenCalledWith([KEY_A]);
    expect(deleteS3Objects.mock.invocationCallOrder[0]).toBeLessThan(deletePendingFilesByKeysInDb.mock.invocationCallOrder[0]);
    expect(logError).not.toHaveBeenCalled();
  });

  it('keeps the rows whose objects could not be deleted and alerts with the keys', async () => {
    getStalePendingFileKeysInDb.mockResolvedValue([KEY_A, KEY_B]);
    deleteS3Objects.mockResolvedValue({ deletedCount: 1, failedKeys: [KEY_B] });

    await deletePendingFileUploads();

    expect(deletePendingFilesByKeysInDb).toHaveBeenCalledWith([KEY_A]);
    expect(logError).toHaveBeenCalledTimes(1);
    const [message, , additionalInfo] = logError.mock.calls[0];
    expect(message).toContain('1 of 2');
    expect(additionalInfo).toEqual({ failedKeys: [KEY_B] });
  });

  it('skips the bucket and the rows when nothing is stale', async () => {
    getStalePendingFileKeysInDb.mockResolvedValue([]);

    await deletePendingFileUploads();

    expect(deleteS3Objects).not.toHaveBeenCalled();
    expect(deletePendingFilesByKeysInDb).not.toHaveBeenCalled();
  });
});
