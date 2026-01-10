import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { rm } from 'fs/promises';
import sanitize from 'sanitize-filename';

import { getAppDataPath, publicDir } from '../setup/index.js';

import { ensureDirectory } from './fileManagement.js';

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

/**
 * Fixes encoding issues where UTF-8 bytes are incorrectly interpreted as Latin-1.
 *
 * Multer uses Busboy internally, which defaults to 'latin1' charset for parsing
 * Content-Disposition header parameters (like filenames). This causes UTF-8
 * characters to be misinterpreted.
 *
 * Example: 'ø' (UTF-8: 0xC3 0xB8) gets misinterpreted as 'Ã¸' (Latin-1: 0xC3 0xB8)
 *
 * Solution: Convert the string back to bytes using Latin-1 (which preserves
 * byte values), then re-interpret those bytes as UTF-8.
 *
 * Note: This is the standard workaround since Multer doesn't expose Busboy's
 * defParamCharset option directly.
 * @link https://github.com/expressjs/multer/issues/1104
 */
function fixFilenameEncoding(filename: string): string {
  try {
    // Convert the string back to bytes using Latin-1 (which preserves byte values),
    // then re-interpret those bytes as UTF-8
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch (error) {
    // If conversion fails, return the original filename
    return filename;
  }
}

// Define multer storage object
export const storage = multer.diskStorage({
  destination: function (_req, file, cb) {
    const appDataPath = getAppDataPath();
    if (appDataPath === '') {
      throw new Error('Could not resolve public folder for platform');
    }

    ensureDirectory(publicDir.uploadsDir);

    const fixedFilename = fixFilenameEncoding(file.originalname);
    const sanitisedName = sanitize(fixedFilename);
    const filePath = path.join(publicDir.uploadsDir, sanitisedName);

    // Check if file already exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File does not exist, can safely proceed to this destination
        cb(null, publicDir.uploadsDir);
      } else {
        generateNewFileName(filePath, (newName) => {
          file.originalname = newName;
          cb(null, publicDir.uploadsDir);
        });
      }
    });
  },
  filename: function (_, file, cb) {
    cb(null, file.originalname);
  },
});

/**
 * Clears the directory that holds the uploads
 */
export async function clearUploadfolder() {
  try {
    await rm(publicDir.uploadsDir, { recursive: true });
  } catch (_) {
    // we dont care that there was no folder
  }
}
