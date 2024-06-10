import { existsSync, mkdirSync } from 'fs';
import { readdir } from 'fs/promises';
import { parse } from 'path';

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
  return await readdir(folderPath);
}

/**
 * @description Takes a filename and removes the extension
 * @param {string} filename - filename with extension
 */
export function removeFileExtension(filename: string): string {
  return parse(filename).name;
}

/**
 * Gets a file name from a path
 * @param filePath
 */
export function getFileNameFromPath(filePath: string): string {
  return parse(filePath).base;
}

/**
 * Changes a file name to indicate it has been recovered
 * @param filePath
 * @returns
 */
export function nameRecovered(filePath: string): string {
  let newName = getFileNameFromPath(filePath);
  const extension = newName.split('.').pop();
  newName = newName.replace(`.${extension}`, '');
  return `${newName} (recovered).${extension}`;
}

/**
 * Utility checks whether a file exists at a given path
 * @param filePath
 * @returns {boolean}
 */
export function checkIfFileExists(filePath: string): boolean {
  return existsSync(filePath);
}
