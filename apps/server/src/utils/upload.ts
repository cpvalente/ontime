import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { ensureDirectory } from './fileManagement.js';
import { directories } from '../setup/index.js';

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
export const storage = multer.diskStorage({
  destination: function (_req, file, cb) {
    const appDataPath = directories.appDataPath;
    if (appDataPath === '') {
      throw new Error('Could not resolve public folder for platform');
    }

    ensureDirectory(directories.projectsDirectory);

    const filePath = path.join(directories.projectsDirectory, file.originalname);

    // Check if file already exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File does not exist, can safely proceed to this destination
        cb(null, directories.projectsDirectory);
      } else {
        generateNewFileName(filePath, (newName) => {
          file.originalname = newName;
          cb(null, directories.projectsDirectory);
        });
      }
    });
  },
  filename: function (_, file, cb) {
    cb(null, file.originalname);
  },
});
