import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import fs, { existsSync } from 'fs';

import { rm } from 'fs/promises';

import { config } from './config.js';
import { ensureDirectory } from '../utils/fileManagement.js';
import { consoleHighlight } from '../utils/console.js';

const DEMO_PROJECT = 'demo project.json';

// =================================================
// resolve public path

/**
 * @description Returns public path depending on OS
 * This is the correct path for the app running in production mode
 */
export function getAppDataPath(): string {
  // handle docker
  if (process.env.ONTIME_DATA) {
    return path.join(process.env.ONTIME_DATA);
  }

  switch (process.platform) {
    case 'darwin': {
      return path.join(process.env.HOME!, 'Library', 'Application Support', 'Ontime');
    }
    case 'win32': {
      return path.join(process.env.APPDATA!, 'Ontime');
    }
    case 'linux': {
      return path.join(process.env.HOME!, '.Ontime');
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
export const srcDirectory = isProduction ? currentDir : path.join(currentDir, '../');

// resolve path to external
const productionPath = path.join(srcDirectory, 'client/');
const devPath = path.join(srcDirectory, '../../client/build/');

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

// path to public db (these are needed before getLastLoadedProject)
export const pathToStartDb = isTest
  ? join(srcDirectory, '..', config.database.testdb, config.database.filename)
  : join(srcDirectory, '/preloaded-db/', config.database.filename);
export const resolveDbDirectory = join(testDbStartDirectory, isTest ? `../${config.database.testdb}` : config.projects);

const ensureAppState = (firstStartup = false) => {
  ensureDirectory(getAppDataPath());
  if (firstStartup) {
    fs.writeFileSync(appStatePath, JSON.stringify({ lastLoadedProject: DEMO_PROJECT }));
    const demoProjectPath = join(resolveDbDirectory, DEMO_PROJECT);
    ensureDirectory(resolveDbDirectory);
    if (!existsSync(demoProjectPath)) {
      // if it is already there dont override it
      fs.copyFileSync(pathToStartDb, join(resolveDbDirectory, DEMO_PROJECT));
    }
  } else {
    fs.writeFileSync(appStatePath, JSON.stringify({ lastLoadedProject: '' }));
  }
};

const getLastLoadedProject = () => {
  try {
    const appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
    if (!appState.lastLoadedProject) {
      ensureAppState();
    }
    return appState.lastLoadedProject;
  } catch (_) {
    if (!isTest) {
      consoleHighlight('No app state found, most lilky first startup');
      ensureAppState(true);
      return DEMO_PROJECT;
    }
  }
};

const lastLoadedProject = isTest ? 'db.json' : getLastLoadedProject();

// path to public db
export const resolveDbName = lastLoadedProject ? lastLoadedProject : config.database.filename;
export const resolveDbPath = join(resolveDbDirectory, resolveDbName);

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

// path to corrupted files
export const resolveCorruptedFilesDirectory = join(getAppDataPath(), config.corrupt);

// path to projects
export const resolveProjectsDirectory = join(getAppDataPath(), config.projects);

export async function clearUploadfolder() {
  try {
    await rm(uploadsFolderPath, { recursive: true });
  } catch (_) {
    //we dont care that there was no folder
  }
}
