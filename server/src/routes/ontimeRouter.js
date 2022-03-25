import express from 'express';
import { uploadFile } from '../utils/upload.js';

export const router = express.Router();

import {
  dbDownload,
  dbUpload,
  getInfo,
  postInfo,
  dbPathToUpload,
  getOSC,
  postOSC,
  getSettings,
  postSettings,
  getAliases,
  postAliases,
  poll,
  getUserFields,
  postUserFields,
} from '../controllers/ontimeController.js';

// create route between controller and '/ontime/sync' endpoint
router.get('/poll', poll);

// create route between controller and '/ontime/db' endpoint
router.get('/db', dbDownload);

// create route between controller and '/ontime/db' endpoint
router.post('/db', uploadFile, dbUpload);

// create route between controller and '/ontime/settings' endpoint
router.get('/settings', getSettings);

// create route between controller and '/ontime/settings' endpoint
router.post('/settings', postSettings);

// create route between controller and '/ontime/aliases' endpoint
router.get('/aliases', getAliases);

// create route between controller and '/ontime/aliases' endpoint
router.post('/aliases', postAliases);

// create route between controller and '/ontime/aliases' endpoint
router.get('/userfields', getUserFields);

// create route between controller and '/ontime/aliases' endpoint
router.post('/userfields', postUserFields);

// create route between controller and '/ontime/info' endpoint
router.get('/info', getInfo);

// create route between controller and '/ontime/info' endpoint
router.post('/info', postInfo);

// create route between controller and '/ontime/osc' endpoint
router.get('/osc', getOSC);

// create route between controller and '/ontime/osc' endpoint
router.post('/osc', postOSC);

// create route between controller and '/ontime/dbpath' endpoint
router.post('/dbpath', dbPathToUpload);
