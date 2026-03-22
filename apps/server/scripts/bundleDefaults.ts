import { writeFile } from 'node:fs/promises';
import path from 'path';

import { defaultDemoHtml } from '../src/external/bundledDemoHtml';
import { defaultCss } from '../src/user/styles/bundledCss';
import { defaultTranslation } from '../src/user/translations/bundledTranslations';

const srcDir = path.resolve(process.cwd(), 'src');

const bundles = [
  { file: path.resolve(srcDir, 'user', 'styles', 'override.css'), content: defaultCss, label: 'CSS' },
  { file: path.resolve(srcDir, 'user', 'translations', 'translations.json'), content: defaultTranslation, label: 'Translation' },
  { file: path.resolve(srcDir, 'external', 'demo', 'index.html'), content: defaultDemoHtml, label: 'Demo HTML' },
];

async function bundleDefaults() {
  for (const { file, content, label } of bundles) {
    try {
      await writeFile(file, content, { encoding: 'utf8' });
    } catch (error) {
      console.error(`Failed writing ${label} file: `, error);
    }
  }
}

bundleDefaults();
