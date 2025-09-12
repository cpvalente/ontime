import { writeFile } from 'node:fs/promises';
import path from 'path';

import { defaultCss } from '../src/user/styles/bundledCss';

/**
 * Script to write contents of bundledCss to override.css
 */
async function bundleCss() {
  try {
    const stylesDir = path.resolve(process.cwd(), 'src', 'user', 'styles');
    const cssFile = path.resolve(stylesDir, 'override.css');

    await writeFile(cssFile, defaultCss, { encoding: 'utf8' });
  } catch (error) {
    console.error('Failed writing to CSS file: ', error);
  }
}

bundleCss();
