import { copyDirectory, ensureDirectory } from '../utils/fileManagement.js';

import { publicDir, srcDir } from './index.js';

/**
 * @description ensures directories exist and populates demo folder
 */
export const populateDemo = () => {
  ensureDirectory(publicDir.demoDir);

  // even if demo exist we want to use startup demo
  try {
    copyDirectory(srcDir.demoDir, publicDir.demoDir);
  } catch (_) {
    /* we do not handle this */
  }
};
