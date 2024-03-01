import { copyFile } from 'fs/promises';
import { pathToStartDemo, resolveDemoDirectory, resolveDemoPath } from './index.js';
import { ensureDirectory } from '../utils/fileManagement.js';

/**
 * @description ensures directories exist and populates demo folder
 */
export const populateDemo = () => {
  ensureDirectory(resolveDemoDirectory);
  // even if demo exist we want to use startup demo
  try {
    Promise.all(
      resolveDemoPath.map((to, index) => {
        const from = pathToStartDemo[index];
        return copyFile(from, to);
      }),
    );
  } catch (_) {
    /* we do not handle this */
  }
};
