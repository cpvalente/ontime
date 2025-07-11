import { copyFileSync, existsSync } from 'fs';

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
      // copy the startup stylesheet only if user doesnt have one
      copyFileSync(srcFiles.translationsFile, publicFiles.translationsFile);
    }
  } catch (_) {
    /* we do not handle this */
  }
};
