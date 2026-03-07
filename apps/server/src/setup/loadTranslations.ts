import { copyFileSync, existsSync, writeFileSync } from 'fs';

import { defaultTranslation } from '../user/translations/bundledTranslations.js';
import { ensureDirectory } from '../utils/fileManagement.js';
import { publicDir, publicFiles, srcFiles } from './index.js';

/**
 * ensures directories exist and populates translation
 */
export const populateTranslation = () => {
  ensureDirectory(publicDir.translationsDir);
  // if translations doesn't exist we want to use startup translation
  try {
    copyFileSync(srcFiles.translationReadme, publicFiles.translationReadme);
    if (!existsSync(publicFiles.translationsFile)) {
      // copy the startup translation only if user doesnt have one
      writeFileSync(publicFiles.translationsFile, defaultTranslation, { encoding: 'utf-8' });
    }
  } catch (_) {
    /* we do not handle this */
  }
};
