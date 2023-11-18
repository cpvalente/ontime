import express from 'express';
import { uploadFile } from '../utils/upload.js';
import {
  dbDownload,
  dbUpload,
  getAliases,
  getInfo,
  getOSC,
  getSettings,
  getUserFields,
  getViewSettings,
  patchPartialProjectFile,
  poll,
  postAliases,
  postNew,
  postOSC,
  postOscSubscriptions,
  postSettings,
  postUserFields,
  postViewSettings,
  previewExcel,
  sheetAuthUrl,
  sheetAuthState,
  sheetClientFile,
  previewSheet,
} from '../controllers/ontimeController.js';

import {
  validateAliases,
  validateOSC,
  validateOscSubscription,
  validatePatchProjectFile,
  validateSettings,
  validateUserFields,
  viewValidator,
} from '../controllers/ontimeController.validate.js';
import { projectSanitiser } from '../controllers/projectController.validate.js';

export const router = express.Router();

// create route between controller and '/ontime/sync' endpoint
router.get('/poll', poll);

// create route between controller and '/ontime/db' endpoint
router.get('/db', dbDownload);

// create route between controller and '/ontime/db' endpoint
router.post('/db', uploadFile, dbUpload);

// create route between controller and '/ontime/excel' endpoint
router.patch('/db', validatePatchProjectFile, patchPartialProjectFile);

// create route between controller and '/ontime/preview-spreadsheet' endpoint
router.post('/preview-spreadsheet', uploadFile, previewExcel);

// create route between controller and '/ontime/settings' endpoint
router.get('/settings', getSettings);

// create route between controller and '/ontime/settings' endpoint
router.post('/settings', validateSettings, postSettings);

// create route between controller and '/ontime/views' endpoint
router.get('/views', getViewSettings);

// create route between controller and '/ontime/views' endpoint
router.post('/views', viewValidator, postViewSettings);

// create route between controller and '/ontime/aliases' endpoint
router.get('/aliases', getAliases);

// create route between controller and '/ontime/aliases' endpoint
router.post('/aliases', validateAliases, postAliases);

// create route between controller and '/ontime/aliases' endpoint
router.get('/userfields', getUserFields);

// create route between controller and '/ontime/aliases' endpoint
router.post('/userfields', validateUserFields, postUserFields);

// create route between controller and '/ontime/info' endpoint
router.get('/info', getInfo);

// create route between controller and '/ontime/osc' endpoint
router.get('/osc', getOSC);

// create route between controller and '/ontime/osc' endpoint
router.post('/osc', validateOSC, postOSC);

// create route between controller and '/ontime/osc-subscriptions' endpoint
router.post('/osc-subscriptions', validateOscSubscription, postOscSubscriptions);

// create route between controller and '/ontime/new' endpoint
router.post('/new', projectSanitiser, postNew);

// create route between controller and '/ontime/sheet-client' endpoint
router.post('/sheet-clientsecrect', uploadFile, sheetClientFile);

// create route between controller and '/ontime/sheet-authstatus' endpoint
router.get('/sheet-authstatus', sheetAuthState);

// create route between controller and '/ontime/sheet-authstatus' endpoint
router.get('/sheet-authurl', sheetAuthUrl);

router.get('/sheet-authurl', previewSheet);

// create route between controller and '/ontime/preview-sheet' endpoint
router.get('/sheet-preview', previewSheet);