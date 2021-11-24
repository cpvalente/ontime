import express from 'express';
import { uploadFile } from '../utils/upload.js';
export const router = express.Router();

import {
  dbDownload,
  dbUpload,
  getInfo,
  postInfo,
  dbPathToUpload,
} from '../controllers/ontimeController.js';

// create route between controller and '/ontime/db' endpoint
router.get('/db', dbDownload);

// create route between controller and '/ontime/db' endpoint
router.post('/db', uploadFile, dbUpload);

// create route between controller and '/ontime/info' endpoint
router.get('/info', uploadFile, getInfo);

// create route between controller and '/ontime/info' endpoint
router.post('/info', postInfo);

// create route between controller and '/ontime/dbpath' endpoint
router.post('/dbpath', dbPathToUpload);
