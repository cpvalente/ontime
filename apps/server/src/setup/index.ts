import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

import { config } from './config.js';
import { ensureDirectory } from '../utils/fileManagement.js';

// =================================================
// resolve public path

/**
 * @description Returns public path depending on OS
 * This is the correct path for the app running in production mode
 */
export function getAppDataPath(): string {
  // handle docker
  if (process.env.ONTIME_DATA) {
    return join(process.env.ONTIME_DATA);
  }

  switch (process.platform) {
    case 'darwin': {
      return join(process.env.HOME!, 'Library', 'Application Support', 'Ontime');
    }
    case 'win32': {
      return join(process.env.APPDATA!, 'Ontime');
    }
    case 'linux': {
      return join(process.env.HOME!, '.Ontime');
    }
    default: {
      throw new Error('Could not resolve public folder for platform');
    }
  }
}

// =================================================
// resolve running environment
const env = process.env.NODE_ENV || 'production';

export const isTest = Boolean(process.env.IS_TEST);
export const environment = isTest ? 'test' : env;
export const isDocker = env === 'docker';
export const isProduction = isDocker || (env === 'production' && !isTest);

// =================================================
// Resolve directory paths

// resolve file URL in both CJS and ESM (build and dev)
if (import.meta.url) {
  globalThis.__dirname = fileURLToPath(import.meta.url);
}

// path to server src folder
const currentDir = dirname(__dirname);
// locally we are in src/setup, in the production build, this is a single file at src
export const srcDirectory = isProduction ? currentDir : join(currentDir, '../');

// TODO: simplify logic
// resolve path to client
const productionPath = join(srcDirectory, 'client/');
const devPath = join(srcDirectory, '../../client/build/');
export const resolvedPath = (): string => {
  if (isTest) {
    return devPath;
  }
  if (isProduction) {
    return productionPath;
  }
  return devPath;
};

const testDbStartDirectory = isTest ? '../' : getAppDataPath();
export const externalsStartDirectory = isProduction ? getAppDataPath() : join(srcDirectory, 'external');
// TODO: we only need one when they are all in the same folder
export const resolveExternalsDirectory = join(isProduction ? getAppDataPath() : srcDirectory, 'external');

// project files
export const appStatePath = join(getAppDataPath(), config.appState);
export const uploadsFolderPath = join(getAppDataPath(), config.uploads);

const ensureAppState = () => {
  ensureDirectory(getAppDataPath());
  writeFileSync(appStatePath, JSON.stringify({ lastLoadedProject: 'db.json' }));
};

const getLastLoadedProject = () => {
  try {
    const appState = JSON.parse(readFileSync(appStatePath, 'utf8'));
    if (!appState.lastLoadedProject) {
      ensureAppState();
    }
    return appState.lastLoadedProject;
  } catch {
    if (!isTest) {
      ensureAppState();
    }
  }
};

const lastLoadedProject = isTest ? 'db.json' : getLastLoadedProject();

// path to public db
export const resolveDbDirectory = join(testDbStartDirectory, isTest ? `../${config.database.testdb}` : config.projects);
export const resolveDbName = lastLoadedProject ? lastLoadedProject : config.database.filename;
export const resolveDbPath = join(resolveDbDirectory, resolveDbName);

export const pathToStartDb = isTest
  ? join(srcDirectory, '..', config.database.testdb, config.database.filename)
  : join(srcDirectory, '/preloaded-db/', config.database.filename);

// path to public styles
export const resolveStylesDirectory = join(externalsStartDirectory, config.styles.directory);
export const resolveStylesPath = join(resolveStylesDirectory, config.styles.filename);

export const pathToStartStyles = join(srcDirectory, '/external/styles/', config.styles.filename);

// path to public demo
export const resolveDemoDirectory = join(
  externalsStartDirectory,
  isProduction ? '/external/' : '', // move to external folder in production
  config.demo.directory,
);
export const resolveDemoPath = config.demo.filename.map((file) => {
  return join(resolveDemoDirectory, file);
});

export const pathToStartDemo = config.demo.filename.map((file) => {
  return join(srcDirectory, '/external/demo/', file);
});

// path to restore file
export const resolveRestoreFile = join(getAppDataPath(), config.restoreFile);

// path to sheets folder
export const resolveSheetsDirectory = join(getAppDataPath(), config.sheets.directory);

// path to crash reports
export const resolveCrashReportDirectory = join(getAppDataPath(), config.crash);

// path to projects
export const resolveProjectsDirectory = join(getAppDataPath(), config.projects);

// path to corrupt files
export const resolveCorruptDirectory = join(getAppDataPath(), config.corrupt);
