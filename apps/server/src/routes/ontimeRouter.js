import express from 'express';
import { uploadFile } from '../utils/upload.js';
import {
  dbDownload,
  dbPathToUpload,
  dbUpload,
  getAliases,
  getInfo,
  getOSC,
  getSettings,
  getUserFields,
  getViewSettings,
  poll,
  postAliases,
  postOSC,
  postSettings,
  postUserFields,
  postViewSettings,
} from '../controllers/ontimeController.js';

import {
  viewValidator,
  validateAliases,
  validateUserFields,
  validateSettings,
  validateOSC,
} from '../controllers/ontimeController.validate.js';

export const router = express.Router();

// create route between controller and '/ontime/sync' endpoint
router.get('/poll', poll);

// create route between controller and '/ontime/db' endpoint
router.get('/db', dbDownload);

// create route between controller and '/ontime/db' endpoint
router.post('/db', uploadFile, dbUpload);

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

// create route between controller and '/ontime/dbpath' endpoint
router.post('/dbpath', dbPathToUpload);
