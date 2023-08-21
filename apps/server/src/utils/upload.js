import multer from 'multer';
import path from 'path';

import { EXCEL_MIME, JSON_MIME } from './parser.js';
import { ensureDirectory } from './fileManagement.js';
import { getAppDataPath } from '../setup.js';

// Define multer storage object
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // get platform path
    const appDataPath = getAppDataPath();
    if (appDataPath === '') {
      throw new Error('Could not resolve public folder for platform');
    }
    // append uploads folder
    const newDestination = path.join(appDataPath, 'uploads');

    // Create directory if not exist
    ensureDirectory(newDestination);
    cb(null, newDestination);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}--${file.originalname}`);
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
