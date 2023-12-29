import multer from 'multer';
import path from 'path';
import { existsSync } from 'fs';

import { EXCEL_MIME, JSON_MIME } from './parser.js';
import { ensureDirectory } from './fileManagement.js';
import { getAppDataPath } from '../setup.js';

/**
 * Generates a unique filename by appending a counter to the base name if necessary.
 * @param {string} uploadPath - Path where the file will be uploaded.
 * @param {string} originalName - Original name of the file.
 * @return {string} - Unique filename.
 */
export function generateUniqueFilename(uploadPath, originalName) {
  const fileParsed = path.parse(originalName);
  let baseName = fileParsed.name;
  let ext = fileParsed.ext;
  let filename = originalName;
  let fileExists = existsSync(path.join(uploadPath, filename));
  let counter = 1;

  // Append a number to the base name until a unique name is found
  while (fileExists) {
    filename = `${baseName} (${counter})${ext}`;
    fileExists = existsSync(path.join(uploadPath, filename));
    counter++;
  }

  return filename;
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
    ensureDirectory(newDestination);
    cb(null, newDestination);
  },
  filename: function (_, file, cb) {
    const appDataPath = getAppDataPath();
    const uploadPath = path.join(appDataPath, 'uploads');
    const uniqueFilename = generateUniqueFilename(uploadPath, file.originalname);

    cb(null, uniqueFilename);
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
