import { existsSync } from 'fs';
import path from 'path';

/**
 * Generates a unique file name within the specified directory.
 * If a file with the same name already exists, appends a counter to the filename.
 *
 * @param {string} directory - The directory to check for file existence.
 * @param {string} filename - The original filename.
 * @return {Promise<string>} A unique filename.
 */
export const generateUniqueFileName = (directory: string, filename: string) => {
  const baseName = path.basename(filename, path.extname(filename));
  const extension = path.extname(filename);

  let counter = 0;
  let uniqueFilename = filename;

  while (existsSync(path.join(directory, uniqueFilename))) {
    counter++;
    // Append counter to filename if the file exists.
    uniqueFilename = `${baseName} (${counter})${extension}`;
  }

  return uniqueFilename;
};