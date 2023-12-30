import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { EXCEL_MIME, JSON_MIME } from './parser.js';
import { ensureDirectory } from './fileManagement.js';
import { getAppDataPath } from '../setup.js';

// Define multer storage object
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const appDataPath = getAppDataPath();
    if (appDataPath === '') {
      return cb(new Error('Could not resolve public folder for platform'), false);
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
        // File already exists, handle error
        return cb(new Error('File already exists'), false);
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
const filterAllowed = (req, file, cb) => {
  if (file.mimetype.includes(JSON_MIME) || file.mimetype.includes(EXCEL_MIME)) {
    cb(null, true);
  } else {
    console.log('ERROR: Unrecognised file type');
    cb(null, false);
  }
};

// Build multer uploader for a single file
export const uploadFile = multer({
  storage: storage,
  fileFilter: filterAllowed,
}).single('userFile');
