import { copyFileSync } from 'fs';
import { ensureDirectory } from '../utils/fileManagement.js';

import { publicDir, srcFiles } from './index.js';
import { basename, join } from 'path';

/**
 * @description ensures directories exist and populates ontime logo
 */
export function populateOntimeLogo() {
  ensureDirectory(publicDir.logoDir);
  try {
    const logoName = basename(srcFiles.logo);
    copyFileSync(srcFiles.logo, join(publicDir.logoDir, logoName));
  } catch (_) {
    /* we do not handle this */
  }
}
