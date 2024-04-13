import { copyFileSync, existsSync } from 'fs';
import { ensureDirectory } from '../utils/fileManagement.js';
import { directories } from './index.js';

/**
 * @description ensures directories exist and populates stylesheet
 */
export const populateStyles = () => {
  ensureDirectory(directories.stylesDirectory);
  // if styles doesn't exist we want to use startup stylesheet
  if (!existsSync(directories.stylesPath)) {
    try {
      copyFileSync(directories.externalStylesDirectory, directories.stylesPath);
    } catch (_) {
      /* we do not handle this */
    }
  }
};
