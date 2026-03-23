/**
 * This is a feature specific router for integration with google sheets
 */

import express from 'express';

import {
  getWorksheetMetadataFromSheet,
  getWorksheetOptionsFromSheet,
  readFromSheet,
  requestConnection,
  revokeAuthentication,
  verifyAuthentication,
  writeToSheet,
} from './sheets.controller.js';
import { uploadClientSecret } from './sheets.middleware.js';
import {
  validateRequestConnection,
  validateSheetId,
  validateSheetOptions,
  validateWorksheetMetadata,
} from './sheets.validation.js';

export const router = express.Router();

router.get('/connect', verifyAuthentication);
router.post('/:sheetId/connect', uploadClientSecret, validateRequestConnection, requestConnection);

router.post('/revoke', revokeAuthentication);

router.post('/:sheetId/worksheet-options', validateSheetId, getWorksheetOptionsFromSheet);
router.post('/:sheetId/metadata', validateWorksheetMetadata, getWorksheetMetadataFromSheet);

router.post('/:sheetId/read', validateSheetOptions, readFromSheet);
router.post('/:sheetId/write', validateSheetOptions, writeToSheet);
