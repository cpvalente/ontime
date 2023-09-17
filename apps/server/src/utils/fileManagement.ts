import { existsSync, mkdirSync } from 'fs';

/**
 * @description Creates a directory if it doesn't exist
 * @param {string} directory - directory that should exist or will be created
 */
export function ensureDirectory(directory) {
  if (!existsSync(directory)) {
    try {
      mkdirSync(directory, { recursive: true });
    } catch (err) {
      throw new Error(`Could not create directory: ${err}`);
    }
  }
}
