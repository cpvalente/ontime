import multer from 'multer';
import { statSync, mkdirSync } from 'fs';
import { EXCEL_MIME, JSON_MIME } from './parser.js';

// Define multer storage object
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let newDestination = 'uploads/';
    let stat = null;
    try {
      stat = statSync(newDestination);
    } catch (err) {
      mkdirSync(newDestination);
    }
    if (stat && !stat.isDirectory()) {
      throw new Error(
        `Directory cannot be created because an inode of a different type exists at ${newDestination}`
      );
    }
    cb(null, newDestination);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '--' + file.originalname);
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
