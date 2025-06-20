/**
 * This is a feature specific router for integration with Excel
 */

import express from 'express';
import { uploadExcel } from './excel.middleware.js';
import { getWorksheets, postExcel, previewExcel } from './excel.controller.js';
import { validateFileExists, validateImportMapOptions } from './excel.validation.js';

export const router = express.Router();

router.post('/upload', uploadExcel, validateFileExists, postExcel);
router.get('/worksheets', getWorksheets);
router.post('/preview', validateImportMapOptions, previewExcel);

// TODO: validate import map
