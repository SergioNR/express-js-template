import { jest } from '@jest/globals';

jest.unstable_mockModule('../server/models/filesModel.js', () => ({
  createFileInDb: jest.fn(),
  getFilesInDb: jest.fn(),
  getFileByIdInDb: jest.fn(),
  deleteFileInDb: jest.fn(),
  getFileKeysForCompanyInDb: jest.fn(),
}));

jest.unstable_mockModule('../server/integrations/s3/presignPutObject.js', () => ({
  presignPutObject: jest.fn(),
}));

jest.unstable_mockModule('../server/integrations/s3/presignGetObject.js', () => ({
  presignGetObject: jest.fn(),
}));

jest.unstable_mockModule('../server/integrations/s3/deleteS3Objects.js', () => ({
  deleteS3Objects: jest.fn(),
}));

const {
  createFileUpload,
  deleteOneFileById,
  getFileDownloadUrl,
  getFiles,
} = await import('../server/controllers/filesController.js');
const {
  createFileInDb,
  deleteFileInDb,
  getFileByIdInDb,
  getFilesInDb,
} = await import('../server/models/filesModel.js');
const { presignGetObject } = await import('../server/integrations/s3/presignGetObject.js');
const { presignPutObject } = await import('../server/integrations/s3/presignPutObject.js');
const { deleteS3Objects } = await import('../server/integrations/s3/deleteS3Objects.js');

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

const caller = {
  id: 'caller-id',
  email: 'user@acme.test',
  role: 'user',
  company_id: 'company-1',
};

const fileRecord = (overrides = {}) => ({
  id: 'file-1',
  company_id: 'company-1',
  uploaded_by: 'caller-id',
  s3_key: 'company-1/file-1/report.pdf',
  original_filename: 'report.pdf',
  mime_type: 'application/pdf',
  size_bytes: 1234,
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('createFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('presigns the derived key, registers the row and returns 201', async () => {
    presignPutObject.mockResolvedValue('https://bucket.s3/upload-url');
    createFileInDb.mockImplementation(async (fileData) => fileRecord({
      id: fileData.id,
      s3_key: fileData.s3Key,
      original_filename: fileData.originalFilename,
    }));

    const req = {
      user: caller,
      body: { filename: 'quarterly report.pdf', contentType: 'application/pdf', sizeBytes: 1234 },
    };
    const res = mockRes();

    await createFileUpload(req, res);

    expect(res.status).toHaveBeenCalledWith(201);

    const [createdData] = createFileInDb.mock.calls[0];
    expect(createdData.companyId).toBe('company-1');
    expect(createdData.uploadedBy).toBe('caller-id');
    expect(createdData.originalFilename).toBe('quarterly_report.pdf');
    expect(createdData.s3Key).toBe(`company-1/${createdData.id}/quarterly_report.pdf`);
    expect(presignPutObject).toHaveBeenCalledWith(createdData.s3Key, 'application/pdf');

    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.uploadUrl).toBe('https://bucket.s3/upload-url');
    expect(responseBody.file).toMatchObject({
      original_filename: 'quarterly_report.pdf',
      mime_type: 'application/pdf',
      size_bytes: 1234,
      uploaded_by: 'caller-id',
    });
  });

  it('presigns before inserting the row', async () => {
    presignPutObject.mockResolvedValue('https://bucket.s3/upload-url');
    createFileInDb.mockImplementation(async (fileData) => fileRecord({ id: fileData.id }));

    const req = {
      user: caller,
      body: { filename: 'a.txt', contentType: 'text/plain', sizeBytes: 1 },
    };

    await createFileUpload(req, mockRes());

    expect(presignPutObject.mock.invocationCallOrder[0]).toBeLessThan(createFileInDb.mock.invocationCallOrder[0]);
  });

  it('never creates the row when presigning fails', async () => {
    presignPutObject.mockRejectedValue(new Error('S3 unreachable'));

    const req = {
      user: caller,
      body: { filename: 'a.txt', contentType: 'text/plain', sizeBytes: 1 },
    };
    const res = mockRes();

    await expect(createFileUpload(req, res)).rejects.toThrow('S3 unreachable');

    expect(createFileInDb).not.toHaveBeenCalled();
  });
});

describe('getFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the company files with no cursor on the last page', async () => {
    getFilesInDb.mockResolvedValue([fileRecord()]);

    const req = { user: caller, query: {} };
    const res = mockRes();

    await getFiles(req, res);

    expect(getFilesInDb).toHaveBeenCalledWith('company-1', { limit: 50, cursor: undefined });
    expect(res.status).toHaveBeenCalledWith(200);

    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.files).toHaveLength(1);
    expect(responseBody.files[0]).toMatchObject({ id: 'file-1', original_filename: 'report.pdf' });
    expect(responseBody.nextCursor).toBeUndefined();
  });

  it('returns nextCursor when the page is full and caps the limit at 100', async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => fileRecord({ id: `file-${index}` }));
    getFilesInDb.mockResolvedValue(fullPage);

    const req = { user: caller, query: { limit: '500' } };
    const res = mockRes();

    await getFiles(req, res);

    expect(getFilesInDb).toHaveBeenCalledWith('company-1', { limit: 100, cursor: undefined });

    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.nextCursor).toBe('file-99');
  });
});

describe('getFileDownloadUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('answers 404 when the file does not exist in the caller company', async () => {
    getFileByIdInDb.mockResolvedValue(null);

    const req = { user: caller, params: { fileId: 'other-company-file' } };
    const res = mockRes();

    await getFileDownloadUrl(req, res);

    expect(getFileByIdInDb).toHaveBeenCalledWith('other-company-file', 'company-1');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(presignGetObject).not.toHaveBeenCalled();
  });

  it('returns a presigned download URL for a company file', async () => {
    getFileByIdInDb.mockResolvedValue(fileRecord());
    presignGetObject.mockResolvedValue('https://bucket.s3/download-url');

    const req = { user: caller, params: { fileId: 'file-1' } };
    const res = mockRes();

    await getFileDownloadUrl(req, res);

    expect(presignGetObject).toHaveBeenCalledWith('company-1/file-1/report.pdf');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ url: 'https://bucket.s3/download-url' });
  });
});

describe('deleteOneFileById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('answers 404 when the file does not exist in the caller company', async () => {
    getFileByIdInDb.mockResolvedValue(null);

    const req = { user: caller, params: { fileId: 'other-company-file' } };
    const res = mockRes();

    await deleteOneFileById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(deleteS3Objects).not.toHaveBeenCalled();
    expect(deleteFileInDb).not.toHaveBeenCalled();
  });

  it('removes the object best-effort before deleting the row', async () => {
    getFileByIdInDb.mockResolvedValue(fileRecord());
    deleteS3Objects.mockResolvedValue({ deletedCount: 1, failedKeys: [] });
    deleteFileInDb.mockResolvedValue(fileRecord());

    const req = { user: caller, params: { fileId: 'file-1' } };
    const res = mockRes();

    await deleteOneFileById(req, res);

    expect(deleteS3Objects).toHaveBeenCalledWith(['company-1/file-1/report.pdf']);
    expect(deleteS3Objects.mock.invocationCallOrder[0]).toBeLessThan(deleteFileInDb.mock.invocationCallOrder[0]);
    expect(deleteFileInDb).toHaveBeenCalledWith('file-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ fileId: 'file-1' });
  });

  it('still deletes the row when the object delete fails', async () => {
    getFileByIdInDb.mockResolvedValue(fileRecord());
    deleteS3Objects.mockResolvedValue({ deletedCount: 0, failedKeys: ['company-1/file-1/report.pdf'] });
    deleteFileInDb.mockResolvedValue(fileRecord());

    const req = { user: caller, params: { fileId: 'file-1' } };
    const res = mockRes();

    await deleteOneFileById(req, res);

    expect(deleteFileInDb).toHaveBeenCalledWith('file-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
