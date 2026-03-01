import { copyFileSync } from 'fs';

import { copyDirectory, ensureDirectory } from '../utils/fileManagement.js';
import { publicDir, publicFiles, srcDir, srcFiles } from './index.js';

/**
 * @description ensures directories exist and populates demo folder
 */
export async function populateDemo() {
  ensureDirectory(publicDir.demoDir);

  try {
    copyFileSync(srcFiles.externalReadme, publicFiles.externalReadme);
    // even if demo exist we want to use startup demo
    await copyDirectory(srcDir.demoDir, publicDir.demoDir);
  } catch (_) {
    /* we do not handle this */
  }
}
