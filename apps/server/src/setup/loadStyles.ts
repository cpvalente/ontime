import { copyFileSync, existsSync } from 'fs';
import { pathToStartStyles, resolveStylesDirectory, resolveStylesPath } from './index.js';
import { ensureDirectory } from '../utils/fileManagement.js';

/**
 * @description ensures directories exist and populates stylesheet
 */
export const populateStyles = () => {
  ensureDirectory(resolveStylesDirectory);
  // if styles doesn't exist we want to use startup stylesheet
  if (!existsSync(resolveStylesPath)) {
    try {
      copyFileSync(pathToStartStyles, resolveStylesPath);
    } catch (_) {
      /* we do not handle this */
    }
  }
};
