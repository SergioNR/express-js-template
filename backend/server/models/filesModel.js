import { prisma } from '../config/prismaClient.js';

export const createFileInDb = async (fileData) => {
  const {
    id,
    companyId,
    uploadedBy,
    s3Key,
    originalFilename,
    mimeType,
    sizeBytes,
  } = fileData;

  const createFileQuery = await prisma.file.create({
    data: {
      id,
      company_id: companyId,
      uploaded_by: uploadedBy,
      s3_key: s3Key,
      original_filename: originalFilename,
      mime_type: mimeType,
      size_bytes: sizeBytes,
    },
  });

  return createFileQuery;
};

//* Only verified uploads are listed - pending rows are invisible until the
//* confirm endpoint checked the stored object
export const getFilesInDb = async (companyId, pagination = {}) => {
  const getFilesQuery = await prisma.file.findMany({
    where: {
      company_id: companyId,
      status: 'ready',
    },
    //* id tiebreaker keeps the cursor order total when created_at collides
    orderBy: [
      { created_at: 'desc' },
      { id: 'desc' },
    ],
    take: pagination.limit,
    skip: pagination.cursor ? 1 : undefined,
    cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
  });

  return getFilesQuery;
};

//* Scoped by company so one company can never act on another's files.
//* `status` optionally narrows the lookup (e.g. downloads only see ready files)
export const getFileByIdInDb = async (fileId, companyId, status = undefined) => {
  const getFileByIdQuery = await prisma.file.findFirst({
    where: {
      id: fileId,
      company_id: companyId,
      ...(status ? { status } : {}),
    },
  });

  return getFileByIdQuery;
};

//* Company-scoped conditional delete - resolves to false when the row did not
//* exist (or belonged to another company), so callers can answer 404 instead
//* of touching the bucket for a file they do not own
export const deleteFileInDb = async (fileId, companyId) => {
  const deleteResult = await prisma.file.deleteMany({
    where: {
      id: fileId,
      company_id: companyId,
    },
  });

  return deleteResult.count > 0;
};

//* Unconfirmed uploads of a company - bounds the number of presigned URLs a
//* company can hold open at once (see MAX_PENDING_UPLOADS_PER_COMPANY)
export const countPendingFilesInDb = async (companyId) => {
  const pendingCount = await prisma.file.count({
    where: {
      company_id: companyId,
      status: 'pending',
    },
  });

  return pendingCount;
};

//* Used by the company-deletion cleanup: the keys are collected before the
//* company delete cascades the File rows away, so the objects can be removed
//* from the bucket afterwards
export const getFileKeysForCompanyInDb = async (companyId) => {
  const getFileKeysQuery = await prisma.file.findMany({
    where: {
      company_id: companyId,
    },
    select: {
      s3_key: true,
    },
  });

  return getFileKeysQuery.map((file) => file.s3_key);
};

//* Conditional transition so a row the cleanup job removed concurrently is
//* never resurrected. Returns the updated row, or null when it was not pending
export const markFileReadyInDb = async (fileId) => {
  const updateResult = await prisma.file.updateMany({
    where: {
      id: fileId,
      status: 'pending',
    },
    data: {
      status: 'ready',
    },
  });

  if (updateResult.count !== 1) {
    return null;
  }

  return prisma.file.findUnique({
    where: {
      id: fileId,
    },
  });
};

//* Deletes pending rows older than the cutoff in a single statement and
//* returns their keys, so the bucket objects of exactly those rows can be
//* removed afterwards (a row confirmed meanwhile is untouched). Prisma
//* stores UTC wall time in timestamp(3) columns, hence the ISO -> timestamp cast
export const deleteStalePendingFilesInDb = async (createdBefore) => {
  const deletedRows = await prisma.$queryRaw`
    DELETE FROM "File"
    WHERE "status" = 'pending' AND "created_at" < ${createdBefore.toISOString()}::timestamp
    RETURNING "s3_key"
  `;

  return deletedRows.map((row) => row.s3_key);
};
