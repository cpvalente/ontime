import { existsSync, mkdirSync } from 'fs';
import { readdir } from 'fs/promises';
import { basename, extname, join, parse } from 'path';

/**
 * @description Creates a directory if it doesn't exist
 * @param {string} directory - directory that should exist or will be created
 */
export function ensureDirectory(directory: string): void {
  if (!existsSync(directory)) {
    try {
      mkdirSync(directory, { recursive: true });
    } catch (err) {
      throw new Error(`Could not create directory: ${err}`);
    }
  }
}

/**
 * Ensures that a filename ends with .json extension
 */
export function ensureJsonExtension(filename: string | undefined): string | undefined {
  if (!filename) return filename;
  return filename.endsWith('.json') ? filename : `${filename}.json`;
}

/**
 * Lists all files in a directory
 */
export async function getFilesFromFolder(folderPath: string): Promise<string[]> {
  return readdir(folderPath);
}

/**
 * @description Takes a filename and removes the extension
 * @param {string} filename - filename with extension
 */
export const removeFileExtension = (filename: string): string => {
  return parse(filename).name;
};

/**
 * Appends a given string to a file name or path
 * @example appendToName('file.json', '(recovered)') => 'file (recovered).json'
 */
export function appendToName(filePath: string, append: string): string {
  const extension = filePath.split('.').pop();
  return filePath.replace(`.${extension}`, ` ${append}.${extension}`);
}

/**
 * Generates a unique file name within the specified directory.
 * If a file with the same name already exists, appends a counter to the filename.
 */
export function generateUniqueFileName(directory: string, filename: string): string {
  const extension = extname(filename);
  const baseName = basename(filename, extension);

  let counter = 0;
  let uniqueFilename = filename;

  while (fileExists(uniqueFilename)) {
    counter++;
    // Append counter to filename if the file exists.
    uniqueFilename = `${baseName} (${counter})${extension}`;
  }

  return uniqueFilename;

  function fileExists(name: string) {
    return existsSync(join(directory, name));
  }
}

/**
 * retrieves the filename from a given path
 */
export function getFileNameFromPath(filePath: string): string {
  return basename(filePath);
}

/**
 * Utility naivly checks for paths on whether it includes directories
 */
export function isPath(filePath: string): boolean {
  return filePath !== basename(filePath);
}
