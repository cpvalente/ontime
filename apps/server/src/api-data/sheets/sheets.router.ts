/**
 * This is a feature specific router for integration with google sheets
 */

import express from 'express';

import { readFromSheet, requestConnection, revokeAuthentication, verifyAuthentication } from './sheets.controller.js';
import { uploadClientSecret } from './sheets.middleware.js';
import { validateRequestConnection, validateSheetOptions } from './sheets.validation.js';

export const router = express.Router();

router.get('/sheet/connect', verifyAuthentication);
router.post('/sheet/:sheetId/connect', uploadClientSecret, validateRequestConnection, requestConnection);

router.post('/sheet/revoke', revokeAuthentication);

router.post('/sheet/:sheetId/read', validateSheetOptions, readFromSheet);
