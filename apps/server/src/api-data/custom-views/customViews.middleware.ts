import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import type { ErrorResponse } from 'ontime-types';

import { customViewMaxFileSize } from './customViews.service.js';

const allowedMimeTypes = new Set(['text/html', 'application/xhtml+xml', 'application/octet-stream']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: customViewMaxFileSize,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type "${file.mimetype}"`));
    }
  },
}).single('indexHtml');

export function uploadCustomViewFile(req: Request, res: Response<ErrorResponse>, next: NextFunction) {
  upload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).send({ message: `File size limit (${customViewMaxFileSize / 1_000_000}MB) exceeded` });
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).send({ message: 'Unexpected upload field. Use "indexHtml"' });
      return;
    }

    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
      return;
    }

    res.status(400).send({ message: 'Could not process upload request' });
  });
}
