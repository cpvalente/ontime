import { existsSync } from 'fs';
import { writeFile } from 'node:fs/promises';
import { defaultCss } from '../src/user/styles/bundledCss';
import path from 'path';

/**
 * Script to write contents of bundledCss to override.css
 */
async function bundleCss() {
  try {
    const stylesDir = path.resolve(process.cwd(), 'src', 'user', 'styles');
    const cssFile = path.resolve(stylesDir, 'override.css');

    if (!existsSync(cssFile)) {
      throw new Error('File does not exist');
    }

    await writeFile(cssFile, defaultCss, { encoding: 'utf8' });
  } catch (error) {
    console.error('Failed writing to CSS file: ', error);
    process.exit(1);
  }
}

bundleCss();
