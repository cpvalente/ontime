import { parse } from 'path';

/**
 * @description Takes a filename and removes the extension
 * @param {string} filename - filename with extension
 */
export const removeFileExtension = (filename: string): string => {
  return parse(filename).name;
};
