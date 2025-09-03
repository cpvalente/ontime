import { existsSync } from 'fs';
import { writeFile } from 'node:fs/promises';
import { defaultTranslation } from '../src/user/translations/bundledTranslation';
import path from 'path';

/**
 * Script to write contents of default translation to translation.json
 */
async function bundleTranslation() {
  try {
    const translationDir = path.resolve(process.cwd(), 'src', 'user', 'translations');
    const translationsFile = path.resolve(translationDir, 'translations.json');

    if (!existsSync(translationsFile)) {
      throw new Error('File does not exist');
    }

    await writeFile(translationsFile, defaultTranslation, { encoding: 'utf8' });
  } catch (error) {
    console.error('Failed writing to translations file: ', error);
  }
}

bundleTranslation();
