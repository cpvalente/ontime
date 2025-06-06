import type { Request } from 'express';
import multer, { type FileFilterCallback } from 'multer';

import { storage } from '../../utils/upload.js';

export const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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
