import type { Request } from 'express';
import multer, { type FileFilterCallback } from 'multer';

import { JSON_MIME } from '../../utils/parser.js';
import { storage } from '../../utils/upload.js';

const filterProjectFile = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.includes(JSON_MIME)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const filterImageFile = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.includes('image')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

// Build multer uploader for a single file
export const uploadProjectFile = multer({
  storage,
  fileFilter: filterProjectFile,
}).single('project');

// Build multer uploader for a single image file
export const uploadImageFile = multer({
  storage,
  fileFilter: filterImageFile,
}).single('image');
