import express from 'express';
import { uploadClientSecret, uploadFile } from '../utils/upload.js';
import {
  dbDownload,
  dbUpload,
  getAliases,
  getInfo,
  getOSC,
  getHTTP,
  getSettings,
  getViewSettings,
  patchPartialProjectFile,
  poll,
  postAliases,
  postOSC,
  postSettings,
  postViewSettings,
  previewExcel,
  postHTTP,
  duplicateProjectFile,
  listProjects,
  loadProject,
  renameProjectFile,
  createProjectFile,
  deleteProjectFile,
} from '../controllers/ontimeController.js';

import {
  validateAliases,
  validateOSC,
  validatePatchProjectFile,
  validateSettings,
  viewValidator,
  validateHTTP,
  validateProjectDuplicate,
  validateLoadProjectFile,
  validateProjectRename,
} from '../controllers/ontimeController.validate.js';
import { projectSanitiser } from '../controllers/projectController.validate.js';
import { sanitizeProjectFilename } from '../utils/sanitizeProjectFilename.js';
import {
  revokeAuthentication,
  readFromSheet,
  requestConnection,
  verifyAuthentication,
  writeToSheet,
} from '../controllers/sheetsController.js';
import { validateRequestConnection, validateSheetOptions } from '../controllers/sheetController.validate.js';

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

// create route between controller and '/ontime/info' endpoint
router.get('/info', getInfo);

// create route between controller and '/ontime/osc' endpoint
router.get('/osc', getOSC);

// create route between controller and '/ontime/osc' endpoint
router.post('/osc', validateOSC, postOSC);

// create route between controller and '/ontime/http' endpoint
router.get('/http', getHTTP);

// create route between controller and '/ontime/http' endpoint
router.post('/http', validateHTTP, postHTTP);

// create route between controller and '/ontime/projects' endpoint
router.get('/projects', listProjects);

// create route between controller and '/ontime/load-project' endpoint
router.post('/load-project', validateLoadProjectFile, sanitizeProjectFilename, loadProject);

// create route between controller and '/ontime/project/:filename/duplicate' endpoint
router.post('/project/:filename/duplicate', validateProjectDuplicate, sanitizeProjectFilename, duplicateProjectFile);

// create route between controller and '/ontime/project/:filename/rename' endpoint
router.put('/project/:filename/rename', validateProjectRename, sanitizeProjectFilename, renameProjectFile);

// create route between controller and '/ontime/project' endpoint
router.post('/project', projectSanitiser, createProjectFile);

// create route between controller and '/ontime/project/:filename' endpoint
router.delete('/project/:filename', sanitizeProjectFilename, deleteProjectFile);

// create route between controller and '/sheet/:sheetId/connect' endpoint
router.post('/sheet/:sheetId/connect', uploadClientSecret, validateRequestConnection, requestConnection);

router.get('/sheet/connect', verifyAuthentication);

router.post('/sheet/revoke', revokeAuthentication);

router.post('/sheet/:sheetId/read', validateSheetOptions, readFromSheet);

router.post('/sheet/:sheetId/write', validateSheetOptions, writeToSheet);
