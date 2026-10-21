import { S3_ALLOWED_MIME_TYPES, S3_MAX_FILE_SIZE_BYTES } from '../../config/s3.js';

export const createFileUploadSchema = {
  filename: {
    in: ['body'],
    notEmpty: {
      errorMessage: 'Filename is required',
    },
    isString: {
      errorMessage: 'Filename must be a string',
    },
    isLength: {
      options: {
        min: 1,
        max: 255,
      },
      errorMessage: 'Filename must be between 1 and 255 characters',
    },
    matches: {
      options: /^[^\\/\r\n\0]+$/,
      errorMessage: 'Filename must not contain path separators or control characters',
    },
    escape: true,
  },
  contentType: {
    in: ['body'],
    notEmpty: {
      errorMessage: 'Content type is required',
    },
    isString: {
      errorMessage: 'Content type must be a string',
    },
    isMimeType: {
      errorMessage: 'Content type must be a valid MIME type',
    },
    isIn: {
      options: [S3_ALLOWED_MIME_TYPES],
      errorMessage: 'Content type is not allowed',
    },
  },
  sizeBytes: {
    in: ['body'],
    notEmpty: {
      errorMessage: 'Size in bytes is required',
    },
    isInt: {
      options: {
        min: 1,
        max: S3_MAX_FILE_SIZE_BYTES,
      },
      errorMessage: `Size must be an integer between 1 and ${S3_MAX_FILE_SIZE_BYTES} bytes`,
    },
    toInt: true,
  },
};
