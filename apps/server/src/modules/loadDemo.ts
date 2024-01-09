import { copyFileSync } from 'fs';
import { pathToStartDemo, resolveDemoDirectory, resolveDemoPath } from '../setup.js';
import { ensureDirectory } from '../utils/fileManagement.js';

/**
 * @description ensures directories exist and populates demo folder
 */
export const populateDemo = () => {
  ensureDirectory(resolveDemoDirectory);
  // even if demo exist we want to use startup demo
  try {
    resolveDemoPath.forEach((to, index) => {
      const from = pathToStartDemo[index];
      copyFileSync(from, to);
    });
  } catch (_) {
    /* we do not handle this */
  }
};
