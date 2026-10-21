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

export const getFilesInDb = async (companyId, pagination = {}) => {
  const getFilesQuery = await prisma.file.findMany({
    where: {
      company_id: companyId,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: pagination.limit,
    skip: pagination.cursor ? 1 : undefined,
    cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
  });

  return getFilesQuery;
};

//* Scoped by company so one company can never act on another's files
export const getFileByIdInDb = async (fileId, companyId) => {
  const getFileByIdQuery = await prisma.file.findFirst({
    where: {
      id: fileId,
      company_id: companyId,
    },
  });

  return getFileByIdQuery;
};

export const deleteFileInDb = async (fileId) => {
  const deleteFileQuery = await prisma.file.delete({
    where: {
      id: fileId,
    },
  });

  return deleteFileQuery;
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
