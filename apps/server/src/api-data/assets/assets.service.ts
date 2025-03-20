import { publicFiles } from '../../setup/index.js';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Reads the user's css file
 * @returns css contents in the file
 */
export async function readCssFile(): Promise<string> {
  const path = publicFiles.cssOverride;
  if (!existsSync(path)) {
    throw new Error('File not found');
  }

  const css = await readFile(path, { encoding: 'utf8' });

  return css;
}

/**
 * Writes the user's css file
 * @param css the updated css to write to file
 */
export async function writeCssFile(css: string) {
  const path = publicFiles.cssOverride;
  if (!existsSync(path)) {
    throw new Error('File not found');
  }

  await writeFile(path, css, { encoding: 'utf8' });
}
