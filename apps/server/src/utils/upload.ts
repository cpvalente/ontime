import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

import { EXCEL_MIME, JSON_MIME } from './parser.js';
import { ensureDirectory } from './fileManagement.js';
import { getAppDataPath } from '../setup.js';

function generateNewFileName(filePath: string, callback: (newName: string) => void) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const extension = path.extname(filePath);
  let counter = 1;

  const checkExistence = (newPath: string) => {
    fs.access(newPath, fs.constants.F_OK, (err) => {
      if (err) {
        // File with the new name does not exist, use this name
        callback(path.basename(newPath));
      } else {
        // File exists, increment the counter and try again
        newPath = path.join(path.dirname(filePath), `${baseName} (${++counter})${extension}`);
        checkExistence(newPath);
      }
    });
  };

  const newPath = path.join(path.dirname(filePath), `${baseName} (${counter})${extension}`);
  checkExistence(newPath);
}

// Define multer storage object
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const appDataPath = getAppDataPath();
    if (appDataPath === '') {
      throw new Error('Could not resolve public folder for platform');
    }

    const uploadsPath = path.join(appDataPath, 'uploads');
    ensureDirectory(uploadsPath);

    const filePath = path.join(uploadsPath, file.originalname);

    // Check if file already exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File does not exist, can safely proceed to this destination
        cb(null, uploadsPath);
      } else {
        generateNewFileName(filePath, (newName) => {
          file.originalname = newName;
          cb(null, uploadsPath);
        });
      }
    });
  },
  filename: function (_, file, cb) {
    cb(null, file.originalname);
  },
});

/**
 * @description Middleware function to filter allowed file types
 * @argument file - reference to file
 * @return {boolean} - file allowed
 */
const filterUserFile = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.includes(JSON_MIME) || file.mimetype.includes(EXCEL_MIME)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Build multer uploader for a single file
export const uploadFile = multer({
  storage,
  fileFilter: filterUserFile,
}).single('userFile');

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
