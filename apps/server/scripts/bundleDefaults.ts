import path from 'path';

import { defaultCss } from '../src/bundle/bundledCss';
import { defaultDemoHtml } from '../src/bundle/bundledDemoHtml';
import { defaultTranslation } from '../src/bundle/bundledTranslations';
import { ensureDirectory, writeToFile } from '../src/utils/fileManagement';

const srcDir = path.resolve(process.cwd(), 'src');

const bundles = [
  { file: path.resolve(srcDir, 'user', 'styles', 'override.css'), content: defaultCss, label: 'CSS' },
  {
    file: path.resolve(srcDir, 'user', 'translations', 'translations.json'),
    content: defaultTranslation,
    label: 'Translation',
  },
  { file: path.resolve(srcDir, 'external', 'demo', 'index.html'), content: defaultDemoHtml, label: 'Demo HTML' },
];

async function bundleDefaults() {
  for (const { file, content, label } of bundles) {
    try {
      ensureDirectory(path.dirname(file));
      await writeToFile(file, content, { encoding: 'utf8' });
    } catch (error) {
      console.error(`Failed writing ${label} file: `, error);
    }
  }
}

bundleDefaults();
