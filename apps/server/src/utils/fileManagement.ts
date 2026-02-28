import { PathLike, constants, existsSync, mkdirSync } from 'fs';
import { copyFile, readdir, unlink } from 'fs/promises';
import { basename, join, parse } from 'path';

import { consoleError } from './console.js';
import { is } from './is.js';

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
export function ensureJsonExtension(filename: string): string {
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
  let uniqueFilename = filename;

  while (fileExists(uniqueFilename)) {
    // Append counter to filename if the file exists.
    uniqueFilename = incrementProjectNumber(uniqueFilename);
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
 * Utility naively checks for paths on whether it includes directories
 */
export function isPath(filePath: string): boolean {
  return filePath !== basename(filePath);
}

/**
 * Recursively copies a directory and its contents.
 * @param {string} src - The source directory.
 * @param {string} dest - The destination directory.
 */
export async function copyDirectory(src: string, dest: string) {
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

/**
 * @throws if the file already exits
 * workaround avoids origin errors in docker deployments
 * EXDEV cross-device link not permitted
 */
export async function dockerSafeRename(oldPath: PathLike, newPath: PathLike) {
  try {
    await copyFile(oldPath, newPath, constants.COPYFILE_EXCL);
    await unlink(oldPath);
  } catch (error) {
    // for securely reasons we should not let the error or fs leak server file path up the error chain
    if (is.object(error) && 'code' in error && error.code === 'EEXIST') {
      consoleError(`rename error: File already exists ${newPath}`);
      throw new Error(`File already exists`);
    }
    consoleError(`rename error ${error}`);
    throw new Error('Unknown file rename error');
  }
}

/**
 * finds potential file index number in our (*) format and increments
 * the number section (*) must be separated from the name by a space
 * @example incrementProjectNumber('test(1).json') -> 'test(1).json'
 * @example incrementProjectNumber('test (1).json') -> 'test(2).json'
 */
export function incrementProjectNumber(path: string): string {
  const { dir, name, ext } = parse(path);

  if (!name.endsWith(')')) return join(dir, `${name} (1)${ext}`);

  const openingParenIndex = name.lastIndexOf(' (');
  if (openingParenIndex === -1) return join(dir, `${name} (1)${ext}`);

  const maybeNumber = Number(name.slice(openingParenIndex + 2, -1));
  if (isNaN(maybeNumber)) return join(dir, `${name} (1)${ext}`);

  return join(dir, `${name.slice(0, openingParenIndex)} (${maybeNumber + 1})${ext}`);
}

/**
 * @description Delete file from system
 */
export const deleteFile = async (filePath: string) => {
  return await unlink(filePath).catch((error) => {
    console.error('Could not delete file:', error);
  });
};
