import express from 'express';
export const router = express.Router();

import { dbDownload, dbUpload } from '../controllers/ontimeController.js';

// create route between controller and '/ontime/db' endpoint
router.get('/db', dbDownload);
