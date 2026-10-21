import { randomUUID } from 'node:crypto';
import {
  createFileInDb,
  deleteFileInDb,
  getFileByIdInDb,
  getFilesInDb,
  markFileReadyInDb,
} from '../models/filesModel.js';
import { presignPutObject } from '../integrations/s3/presignPutObject.js';
import { headS3Object } from '../integrations/s3/headS3Object.js';
import { presignGetObject } from '../integrations/s3/presignGetObject.js';
import { deleteS3Objects } from '../integrations/s3/deleteS3Objects.js';
import { buildFileS3Key, sanitizeFilename } from '../utils/s3Key.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const parsePagination = (query) => ({
  limit: Math.min(Number.parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  cursor: typeof query.cursor === 'string' && query.cursor.length > 0
    ? query.cursor
    : undefined,
});

const toFileShape = (file) => ({
  id: file.id,
  original_filename: file.original_filename,
  mime_type: file.mime_type,
  size_bytes: file.size_bytes,
  status: file.status,
  uploaded_by: file.uploaded_by,
  created_at: file.created_at,
});

export const createFileUpload = async (req, res) => {
  const { company_id: companyId, id: userId } = req.user;
  const { filename, contentType, sizeBytes } = req.body;

  const fileId = randomUUID();
  const sanitizedFilename = sanitizeFilename(filename);
  const s3Key = buildFileS3Key(companyId, fileId, filename);

  //* Presigning happens before the row insert so an S3 outage never leaves a
  //* catalog entry whose upload URL was never handed out
  const uploadUrl = await presignPutObject(s3Key, contentType, sizeBytes);

  const file = await createFileInDb({
    id: fileId,
    companyId,
    uploadedBy: userId,
    s3Key,
    originalFilename: sanitizedFilename,
    mimeType: contentType,
    sizeBytes,
  }); //* Starts as pending - only listed once confirmed

  return res.status(201).json({
    file: toFileShape(file),
    uploadUrl,
  });
};

//* The client calls this once its PUT to the presigned URL finished. The
//* stored object is checked against the declared size and MIME type before
//* the row becomes visible; a mismatching object is discarded together with
//* its row so a different payload can never sneak in under signed metadata
export const confirmFileUpload = async (req, res) => {
  const { fileId } = req.params;

  const { company_id: companyId } = req.user;

  const file = await getFileByIdInDb(fileId, companyId);

  if (!file) {
    return res.status(404).json({
      message: 'File does not exist',
    });
  }

  if (file.status === 'ready') {
    //* Idempotent - a retried confirm returns the same result
    return res.status(200).json({
      file: toFileShape(file),
    });
  }

  const storedObject = await headS3Object(file.s3_key);

  if (!storedObject) {
    //* Upload not finished (or never started) - the row stays pending so the
    //* client can retry; the cleanup job removes it after an hour
    return res.status(409).json({
      message: 'The uploaded object was not found - upload the file before confirming',
      code: 'FILE_UPLOAD_MISSING',
    });
  }

  const sizeMatches = Number(storedObject.contentLength) === file.size_bytes;
  const typeMatches = String(storedObject.contentType ?? '').toLowerCase() === file.mime_type.toLowerCase();

  if (!sizeMatches || !typeMatches) {
    await deleteS3Objects([file.s3_key]);
    await deleteFileInDb(file.id);

    return res.status(400).json({
      message: 'The uploaded object does not match the declared size or content type - the upload was discarded',
      code: 'FILE_UPLOAD_MISMATCH',
    });
  }

  const readyFile = await markFileReadyInDb(file.id);

  if (!readyFile) {
    //* Removed by the pending-upload cleanup between the lookup and the update
    return res.status(404).json({
      message: 'File does not exist',
    });
  }

  return res.status(200).json({
    file: toFileShape(readyFile),
  });
};

export const getFiles = async (req, res) => {
  const { company_id: companyId } = req.user;

  const { limit, cursor } = parsePagination(req.query);

  const files = await getFilesInDb(companyId, { limit, cursor });

  const nextCursor = files.length === limit && files.length > 0
    ? files[files.length - 1].id
    : undefined;

  return res.status(200).json({
    files: files.map(toFileShape),
    nextCursor,
  });
};

export const getFileDownloadUrl = async (req, res) => {
  const { fileId } = req.params;

  const { company_id: companyId } = req.user;

  //* 404 (not 403) for other companies' files - same anti-enumeration shape
  //* as the team endpoints. Unconfirmed uploads cannot be downloaded
  const file = await getFileByIdInDb(fileId, companyId, 'ready');

  if (!file) {
    return res.status(404).json({
      message: 'File does not exist',
    });
  }

  const url = await presignGetObject(file.s3_key);

  return res.status(200).json({
    url,
  });
};

export const deleteOneFileById = async (req, res) => {
  const { fileId } = req.params;

  const { company_id: companyId } = req.user;

  const file = await getFileByIdInDb(fileId, companyId);

  if (!file) {
    return res.status(404).json({
      message: 'File does not exist',
    });
  }

  //* Objects are removed best-effort (missing keys are a no-op) - the DB row
  //* is the source of truth, so it is always deleted
  await deleteS3Objects([file.s3_key]);
  await deleteFileInDb(file.id);

  return res.status(200).json({
    fileId: file.id,
  });
};
