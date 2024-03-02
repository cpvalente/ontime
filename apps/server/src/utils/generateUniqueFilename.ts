import { existsSync } from 'fs';
import path from 'path';

/**
 * Generates a unique file name within the specified directory.
 * If a file with the same name already exists, appends a counter to the filename.
 */
export const generateUniqueFileName = (directory: string, filename: string): string => {
  const baseName = path.basename(filename, path.extname(filename));
  const extension = path.extname(filename);

  let counter = 0;
  let uniqueFilename = filename;

  while (fileExists(uniqueFilename)) {
    counter++;
    // Append counter to filename if the file exists.
    uniqueFilename = `${baseName} (${counter})${extension}`;
  }

  return uniqueFilename;

  function fileExists(name: string) {
    return existsSync(path.join(directory, name));
  }
};
