import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'node:fs';
import { TranslationObject } from './translations.type.js';
import { publicFiles } from '../../setup/index.js';
import { defaultTranslation } from '../../user/translations/bundledTranslation.js';

export async function readUserTranslation(): Promise<TranslationObject> {
  const path = publicFiles.translationsFile;
  if (!existsSync(path)) {
    await writeFile(path, defaultTranslation, { encoding: 'utf8' });
  }

  const userTranslation = await readFile(path, { encoding: 'utf8' });
  const userTranslationObject = JSON.parse(userTranslation) as TranslationObject;
  return userTranslationObject;
}

export async function writeUserTranslation(translations: TranslationObject) {
  const path = publicFiles.translationsFile;
  const translationsString = JSON.stringify(translations, null, 2);
  await writeFile(path, translationsString, { encoding: 'utf8' });
}
