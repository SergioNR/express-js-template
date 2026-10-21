const MAX_FILENAME_LENGTH = 150;

const FALLBACK_FILENAME = 'file';

//* Server-side filename sanitation - the client's filename is display
//* metadata only, never part of the storage path as-is
export const sanitizeFilename = (filename) => {
  const trimmed = String(filename).trim();

  const sanitized = trimmed
    .normalize('NFKD')
    .replace(/\p{M}/gu, '') // Combining marks left by NFKD are dropped (é -> e)
    .replace(/[^a-zA-Z0-9._()-]+/g, '_') // Runs outside the safe charset collapse to one underscore (parentheses kept)
    .replace(/\.{2,}/g, '.') // Collapse dot runs so '..' can never appear
    .replace(/^[-._]+/, '') // No leading dot/dash/underscore keys
    .replace(/[-._]+$/, '') // No trailing padding characters
    .slice(0, MAX_FILENAME_LENGTH)
    .replace(/[-._]+$/, ''); // Truncation can re-expose trailing padding

  return sanitized.length > 0 ? sanitized : FALLBACK_FILENAME;
};

//* The storage key is always derived server-side: companyId/fileId/filename.
//* A client-supplied key would be a bucket-wide write/read primitive, so the
//* only client input here is the display filename.
export const buildFileS3Key = (companyId, fileId, originalFilename) => `${companyId}/${fileId}/${sanitizeFilename(originalFilename)}`;
