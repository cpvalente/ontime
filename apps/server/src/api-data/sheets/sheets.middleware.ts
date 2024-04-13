import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

import { JSON_MIME } from '../../utils/parser.js';
import { storage } from '../../utils/upload.js';

const filterClientSecret = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.includes(JSON_MIME)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export const uploadClientSecret = multer({
  storage,
  fileFilter: filterClientSecret,
}).single('client_secret');
