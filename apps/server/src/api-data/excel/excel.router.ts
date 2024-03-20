/**
 * This is a feature specific router for integration with Excel
 */

import express from 'express';
import { uploadExcel } from './excel.middleware.js';
import { getWorksheets, postExcel, previewExcel } from './excel.controller.js';
import { validateFileId, validateImportMapOptions } from './excel.validation.js';

export const router = express.Router();

router.post('/upload', uploadExcel, postExcel);
router.get('/:fileId/worksheets', validateFileId, getWorksheets);
router.post('/:fileId/preview', validateFileId, validateImportMapOptions, previewExcel);

// TODO: validate import map
