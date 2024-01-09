import { copyFileSync } from 'fs';
import { pathToStartDemo, resolveDemoDirectory, resolveDemoPath } from '../setup.js';
import { ensureDirectory } from '../utils/fileManagement.js';

/**
 * @description ensures directories exist and populates stylesheet
 * @return {string} - path to stylesheet file
 */
export const populateDemo = () => {
  const demoInDisk = resolveDemoPath;
  ensureDirectory(resolveDemoDirectory);

  // eaven if demoInDisk exist we want to use startup demo
  try {
    demoInDisk.forEach((to, index) => {
      const from = pathToStartDemo[index];
      copyFileSync(from, to);
    });
  } catch (_) {
    /* we do not handle this */
  }

  return demoInDisk;
};
