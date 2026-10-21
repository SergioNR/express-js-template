import { Router } from 'express';
import { checkSchema, param } from 'express-validator';
import {
  createFileUpload,
  deleteOneFileById,
  getFileDownloadUrl,
  getFiles,
} from '../../../controllers/filesController.js';
import { sanitizerResult } from '../../../middlewares/sanitizerResult.js';
import { checkCompanyPermission } from '../../../middlewares/companyPermissionChecker.js';
import { createFileUploadSchema } from '../../../utils/validators/createFileUploadSchema.js';
import { filesListQueryValidationSchema } from '../../../utils/validators/filesListQuerySchema.js';

export const filesRouter = Router();

//* Authentication happens at the apiRouter mounting level; each route adds
//* its own company permission requirement on top

const createUploadValidation = [
  checkSchema(createFileUploadSchema),
  sanitizerResult,
];

const filesListValidation = [
  checkSchema(filesListQueryValidationSchema),
  sanitizerResult,
];

const fileIdParamValidation = [
  param('fileId').isUUID().withMessage('File id must be a valid UUID'),
  sanitizerResult,
];

/**
 * @openapi
 * /api/v1/files:
 *   post:
 *     tags: [Files]
 *     summary: Register a file and get a presigned upload URL
 *     description: Validates the declared file metadata (size, MIME whitelist), creates the file catalog entry and returns a short-lived presigned PUT URL. The client uploads the bytes directly to the bucket with the exact declared `Content-Type`. Uploads abandoned before completion leave an inert catalog entry that only errors when downloaded and can be removed via DELETE. Requires the `files.upload` company permission (global admins bypass permission checks).
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FileUploadRequest'
 *     responses:
 *       201:
 *         description: File registered - upload the bytes to the presigned URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 file:
 *                   $ref: '#/components/schemas/File'
 *                 uploadUrl:
 *                   type: string
 *                   format: uri
 *                   description: Presigned PUT URL (valid for a few minutes)
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors (size over the cap, MIME not whitelisted, invalid filename)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
filesRouter.post('/', checkCompanyPermission('files.upload'), createUploadValidation, createFileUpload);

/**
 * @openapi
 * /api/v1/files:
 *   get:
 *     tags: [Files]
 *     summary: List the caller's company files
 *     description: Cursor-paginated list of the files registered by the caller's company, newest first. Requires the `files.view` company permission (global admins bypass permission checks).
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Page size (default 50, capped at 100)
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: File id to start after (the previous response's nextCursor)
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *                 nextCursor:
 *                   type: string
 *                   format: uuid
 *                   description: Present only when another page exists
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
filesRouter.get('/', checkCompanyPermission('files.view'), filesListValidation, getFiles);

/**
 * @openapi
 * /api/v1/files/{fileId}/download:
 *   get:
 *     tags: [Files]
 *     summary: Get a presigned download URL for a company file
 *     description: Returns a fresh short-lived presigned GET URL for the file's object. URLs expire within minutes - request a new one when needed. Files outside the caller's company answer 404 (no existence leak). Requires the `files.view` company permission (global admins bypass permission checks). Note that a file whose upload never completed resolves to the URL of a non-existent object - the bucket answers 404 when it is fetched.
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Id of the file to download
 *     responses:
 *       200:
 *         description: Presigned download URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Presigned GET URL (valid for a few minutes)
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: File does not exist in the caller's company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
filesRouter.get('/:fileId/download', checkCompanyPermission('files.view'), fileIdParamValidation, getFileDownloadUrl);

/**
 * @openapi
 * /api/v1/files/{fileId}:
 *   delete:
 *     tags: [Files]
 *     summary: Delete a company file
 *     description: Removes the file's object from the bucket (best-effort - the delete is idempotent) and its catalog entry. Only files of the caller's company can be deleted. Requires the `files.delete` company permission (global admins bypass permission checks).
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Id of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileId:
 *                   type: string
 *                   format: uuid
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       403:
 *         description: Missing permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: File does not exist in the caller's company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       422:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
filesRouter.delete('/:fileId', checkCompanyPermission('files.delete'), fileIdParamValidation, deleteOneFileById);

filesRouter.use('/*fallback', (req, res) => {
  res.status(404).json({
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
