import { copyDirectory, ensureDirectory } from '../utils/fileManagement.js';

import { publicDir, srcDir } from './index.js';

/**
 * @description ensures directories exist and populates demo folder
 */
export const populateDemo = () => {
  ensureDirectory(publicDir.externalDemoDir);

  // even if demo exist we want to use startup demo
  try {
    copyDirectory(srcDir.externalDemoDir, publicDir.externalDemoDir);
  } catch (_) {
    /* we do not handle this */
  }
};
