import type { Request } from 'express';
import multer, { type FileFilterCallback } from 'multer';

import { storage } from '../../utils/upload.js';

import { EXCEL_MIME } from './excel.constants.js';

const filterExcel = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.includes(EXCEL_MIME)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
export const uploadExcel = multer({
  storage,
  fileFilter: filterExcel,
}).single('excel');
