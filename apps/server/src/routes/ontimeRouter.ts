import express from 'express';
import { uploadFile } from '../utils/upload.js';
import {
  dbDownload,
  dbUpload,
  getAliases,
  getInfo,
  getOSC,
  getHTTP,
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
  postHTTP,
  duplicateProjectFile,
  listProjects,
  loadProject,
  renameProjectFile,
  createProjectFile,
  deleteProjectFile,
  getAuthenticationUrl,
  uploadSheetClientFile as uploadClientSecret,
  pullSheet,
  pushSheet,
  postId,
  getAuthentication,
  getClientSecrect as getClientSecret,
} from '../controllers/ontimeController.js';

import {
  validateAliases,
  validateOSC,
  validatePatchProjectFile,
  validateSettings,
  validateUserFields,
  viewValidator,
  validateHTTP,
  validateOscSubscription,
  validateProjectDuplicate,
  validateLoadProjectFile,
  validateProjectRename,
  validateProjectCreate,
  validateSheetid,
  validateWorksheet,
  validateSheetOptions,
} from '../controllers/ontimeController.validate.js';
import { projectSanitiser } from '../controllers/projectController.validate.js';
import { sanitizeProjectFilename } from '../utils/sanitizeProjectFilename.js';

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

// create route between controller and '/ontime/http' endpoint
router.get('/http', getHTTP);

// create route between controller and '/ontime/http' endpoint
router.post('/http', validateHTTP, postHTTP);

// create route between controller and '/ontime/new' endpoint
router.post('/new', projectSanitiser, postNew);

// create route between controller and '/ontime/projects' endpoint
router.get('/projects', listProjects);

// create route between controller and '/ontime/load-project' endpoint
router.post('/load-project', validateLoadProjectFile, loadProject);

// create route between controller and '/ontime/project/:filename/duplicate' endpoint
router.post('/project/:filename/duplicate', validateProjectDuplicate, sanitizeProjectFilename, duplicateProjectFile);

// create route between controller and '/ontime/project/:filename/rename' endpoint
router.put('/project/:filename/rename', validateProjectRename, sanitizeProjectFilename, renameProjectFile);

// create route between controller and '/ontime/project' endpoint
router.post('/project', validateProjectCreate, sanitizeProjectFilename, createProjectFile);

// create route between controller and '/ontime/project/:filename' endpoint
router.delete('/project/:filename', sanitizeProjectFilename, deleteProjectFile);

// Google Sheet integration - Step 1
router.post('/sheet/clientsecret', uploadFile, uploadClientSecret);
router.get('/sheet/clientsecret', uploadFile, getClientSecret);

// Google Sheet integration - Step 1
router.get('/sheet/authentication/url', getAuthenticationUrl);
router.get('/sheet/authentication', getAuthentication);

// Google Sheet integration - Step 3
router.post('/sheet/id', validateSheetid, postId);

// Google Sheet integration - Step 4
router.post('/sheet/worksheet', validateWorksheet, postId);

// Google Sheet integration - Step 5
router.post('/sheet/pull', validateSheetOptions, pullSheet);

// Google Sheet integration - Step 6
router.post('/sheet-push', validateSheetOptions, pushSheet);
