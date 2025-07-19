import { publicFiles } from '../../setup/index.js';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { TranslationObject } from './assets.type.js';
import { defaultCss } from '../../user/styles/bundledCss.js';
import { defaultTranslation } from '../../user/translations/bundledTranslation.js';

/**
 * Reads the user's css file
 * @returns css contents in the file
 */
export async function readCssFile(): Promise<string> {
  const path = publicFiles.cssOverride;
  if (!existsSync(path)) {
    await writeFile(path, defaultCss, { encoding: 'utf8' });
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
    await writeFile(path, css, { encoding: 'utf8' });
    return;
  }

  await writeFile(path, css, { encoding: 'utf8' });
}


/**
 * Reads the user's custom translations
 * @returns custom translations of user
 */
export async function readUserTranslation(): Promise<TranslationObject> {
  const path = publicFiles.translationsFile;
  if (!existsSync(path)) {
    await writeFile(path, defaultTranslation, { encoding: 'utf8' });
  }

  const userTranslation = await readFile(path, { encoding: 'utf8' });
  const userTranslationObject = JSON.parse(userTranslation) as TranslationObject;
  return userTranslationObject;
}

/**
 * Writes the user's custom translation file
 * @param translations the updated translations to write to file
 */
export async function writeUserTranslation(translations: TranslationObject) {
  const path = publicFiles.translationsFile;
  const translationsString = JSON.stringify(translations, null, 2);
  await writeFile(path, translationsString, { encoding: 'utf8' });
}
