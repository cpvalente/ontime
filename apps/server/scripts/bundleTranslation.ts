import { writeFile } from 'node:fs/promises';
import path from 'path';

import { defaultTranslation } from '../src/user/translations/bundledTranslations.js';

/**
 * Script to write contents of default translation to translation.json
 */
async function bundleTranslation() {
  try {
    const translationDir = path.resolve(process.cwd(), 'src', 'user', 'translations');
    const translationsFile = path.resolve(translationDir, 'translations.json');

    await writeFile(translationsFile, defaultTranslation, { encoding: 'utf8' });
  } catch (error) {
    console.error('Failed writing to translations file: ', error);
  }
}

bundleTranslation();
