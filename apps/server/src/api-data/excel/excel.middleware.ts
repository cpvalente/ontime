import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

import { EXCEL_MIME } from '../../utils/parser.js';
import { storage } from '../../utils/upload.js';

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
