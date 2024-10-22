import { copyFileSync, existsSync } from 'fs';

import { ensureDirectory } from '../utils/fileManagement.js';

import { publicDir, publicFiles, srcFiles } from './index.js';

/**
 * ensures directories exist and populates stylesheet
 */
export const populateStyles = () => {
  ensureDirectory(publicDir.stylesDir);
  // if styles doesn't exist we want to use startup stylesheet
  try {
    copyFileSync(srcFiles.userReadme, publicFiles.userReadme);
    copyFileSync(srcFiles.cssReadme, publicFiles.cssReadme);
    if (!existsSync(publicFiles.cssOverride)) {
      // copy the startup stylesheet only if user doesnt have one
      copyFileSync(srcFiles.cssOverride, publicFiles.cssOverride);
    }
  } catch (_) {
    /* we do not handle this */
  }
};
