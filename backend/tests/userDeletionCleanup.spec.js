import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/models/sessionModel.js', () => ({
  deleteUserSessions: jest.fn().mockResolvedValue({ deletedCount: 1 }),
}));

jest.unstable_mockModule('../server/models/userModel.js', () => ({
  countUsersInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/models/companyModel.js', () => ({
  deleteCompanyInDb: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../server/models/subscriptionModel.js', () => ({
  cancelCompanySubscriptionInStripe: jest.fn().mockResolvedValue(undefined),
  deleteSubscriptionByCompanyId: jest.fn().mockResolvedValue(undefined),
  getSubscriptionDataInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/models/filesModel.js', () => ({
  getFileKeysForCompanyInDb: jest.fn().mockResolvedValue([]),
}));

jest.unstable_mockModule('../server/integrations/s3/deleteS3Objects.js', () => ({
  deleteS3Objects: jest.fn().mockResolvedValue({ deletedCount: 0, failedKeys: [] }),
}));

const { cleanupAfterUserDeletion } = await import('../server/utils/userDeletionCleanup.js');
const { deleteUserSessions } = await import('../server/models/sessionModel.js');
const { countUsersInDb } = await import('../server/models/userModel.js');
const { deleteCompanyInDb } = await import('../server/models/companyModel.js');
const {
  cancelCompanySubscriptionInStripe,
  deleteSubscriptionByCompanyId,
  getSubscriptionDataInDb,
} = await import('../server/models/subscriptionModel.js');
const { getFileKeysForCompanyInDb } = await import('../server/models/filesModel.js');
const { deleteS3Objects } = await import('../server/integrations/s3/deleteS3Objects.js');

const deletedUser = {
  id: 'user-1',
  company_id: 'company-1',
};

describe('cleanupAfterUserDeletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revokes all sessions of the deleted user', async () => {
    countUsersInDb.mockResolvedValue(2);

    await cleanupAfterUserDeletion(deletedUser);

    expect(deleteUserSessions).toHaveBeenCalledWith(deletedUser.id);
  });

  it('keeps the company and subscription while other users remain', async () => {
    countUsersInDb.mockResolvedValue(1);

    await cleanupAfterUserDeletion(deletedUser);

    expect(getSubscriptionDataInDb).not.toHaveBeenCalled();
    expect(deleteSubscriptionByCompanyId).not.toHaveBeenCalled();
    expect(deleteCompanyInDb).not.toHaveBeenCalled();
  });

  it('cancels the Stripe subscription and deletes the company when the last user is gone', async () => {
    countUsersInDb.mockResolvedValue(0);
    getSubscriptionDataInDb.mockResolvedValue({ id: 'sub_stripe123', expires_at: null });

    await cleanupAfterUserDeletion(deletedUser);

    expect(getSubscriptionDataInDb).toHaveBeenCalledWith(deletedUser.company_id);
    expect(cancelCompanySubscriptionInStripe).toHaveBeenCalledWith({ id: 'sub_stripe123', expires_at: null });
    expect(deleteSubscriptionByCompanyId).toHaveBeenCalledWith(deletedUser.company_id);
    expect(deleteCompanyInDb).toHaveBeenCalledWith(deletedUser.company_id);
  });

  it('still deletes the company when no subscription row exists', async () => {
    countUsersInDb.mockResolvedValue(0);
    getSubscriptionDataInDb.mockResolvedValue(null);

    await cleanupAfterUserDeletion(deletedUser);

    expect(cancelCompanySubscriptionInStripe).not.toHaveBeenCalled();
    expect(deleteSubscriptionByCompanyId).toHaveBeenCalledWith(deletedUser.company_id);
    expect(deleteCompanyInDb).toHaveBeenCalledWith(deletedUser.company_id);
  });

  it('deletes the company file objects after the company rows are gone', async () => {
    countUsersInDb.mockResolvedValue(0);
    getSubscriptionDataInDb.mockResolvedValue(null);
    getFileKeysForCompanyInDb.mockResolvedValue(['company-1/file-1/report.pdf', 'company-1/file-2/data.csv']);

    await cleanupAfterUserDeletion(deletedUser);

    expect(getFileKeysForCompanyInDb).toHaveBeenCalledWith(deletedUser.company_id);
    expect(deleteS3Objects).toHaveBeenCalledWith(['company-1/file-1/report.pdf', 'company-1/file-2/data.csv']);
    expect(deleteCompanyInDb).toHaveBeenCalledWith(deletedUser.company_id);
  });

  it('calls the bucket delete with an empty key list when the company has no files', async () => {
    countUsersInDb.mockResolvedValue(0);
    getSubscriptionDataInDb.mockResolvedValue(null);
    getFileKeysForCompanyInDb.mockResolvedValue([]);

    await cleanupAfterUserDeletion(deletedUser);

    expect(deleteS3Objects).toHaveBeenCalledWith([]);
  });
});
