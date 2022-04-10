import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { EXCEL_MIME, JSON_MIME } from './parser.js';

/**
 * @description Returns public path depending on os
 * @return {string|*}
 */
function getAppDataPath() {
  switch (process.platform) {
    case 'darwin': {
      return path.join(process.env.HOME, 'Library', 'Application Support', 'Ontime');
    }
    case 'win32': {
      return path.join(process.env.APPDATA, 'Ontime');
    }
    case 'linux': {
      return path.join(process.env.HOME, '.Ontime');
    }
    default: {
      return '';
    }
  }
}

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
    if (!existsSync(newDestination)) {
      try {
        mkdirSync(newDestination);
      } catch (err) {
        throw new Error('Could not create directory');
      }
    }
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
