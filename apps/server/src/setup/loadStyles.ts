import { copyFileSync, existsSync } from 'fs';

import { ensureDirectory } from '../utils/fileManagement.js';

import { publicDir, publicFiles, srcFiles } from './index.js';

/**
 * ensures directories exist and populates stylesheet
 */
export const populateStyles = () => {
  ensureDirectory(publicDir.stylesDir);
  // if styles doesn't exist we want to use startup stylesheet
  if (!existsSync(publicFiles.cssOverride)) {
    try {
      // copy the startup stylesheet to the public directory
      copyFileSync(srcFiles.cssOverride, publicFiles.cssOverride);
    } catch (_) {
      /* we do not handle this */
    }
  }
};
