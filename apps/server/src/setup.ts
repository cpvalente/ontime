import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import fs from 'fs';

import { config } from './config/config.js';
import { ensureDirectory } from './utils/fileManagement.js';

// =================================================
// resolve public path

/**
 * @description Returns public path depending on OS
 */
export function getAppDataPath(): string {
  // handle docker
  if (process.env.ONTIME_DATA) {
    return path.join(process.env.ONTIME_DATA);
  }

  switch (process.platform) {
    case 'darwin': {
      return path.join(process.env.HOME, 'Library', 'Application Support', 'Ontime');
    }
    case 'win32': {
      return path.join(process.env.APPDATA, 'Ontime');
    }
    case 'linux': {
      return path.join(process.env.HOME, '.Ontime');
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
export const isProduction = env === ('production' || 'docker') && !isTest;
export const isDocker = env === 'docker';

// =================================================
// resolve path to external
const productionPath = '../../resources/extraResources/client';
const devPath = '../../client/build/';
const dockerPath = 'client/';

export const resolvedPath = (): string => {
  if (isTest) {
    return devPath;
  }
  if (isDocker) {
    return dockerPath;
  }
  if (isProduction) {
    return productionPath;
  }
  return devPath;
};

// resolve file URL in both CJS and ESM (build and dev)
if (import.meta.url) {
  globalThis.__dirname = fileURLToPath(import.meta.url);
}

// path to server src folder
export const currentDirectory = dirname(__dirname);

const testDbStartDirectory = isTest ? '../' : getAppDataPath();
export const externalsStartDirectory = isProduction ? getAppDataPath() : join(currentDirectory, 'external');

const lastLoadedProjectConfigPath = join(getAppDataPath(), 'config.json');

let lastLoadedProject;

try {
  lastLoadedProject = JSON.parse(fs.readFileSync(lastLoadedProjectConfigPath, 'utf8')).lastLoadedProject;
} catch {
  if (!isTest) {
    ensureDirectory(getAppDataPath());
    fs.writeFileSync(lastLoadedProjectConfigPath, JSON.stringify({ lastLoadedProject: null }));
  }
}

const configDbDirectory = lastLoadedProject ? 'uploads' : config.database.directory;

// path to public db
export const resolveDbDirectory = join(testDbStartDirectory, isTest ? config.database.testdb : configDbDirectory);
export const resolveDbPath = join(resolveDbDirectory, lastLoadedProject ? lastLoadedProject : config.database.filename);

export const pathToStartDb = isTest
  ? join(currentDirectory, '../', config.database.testdb, config.database.filename)
  : join(currentDirectory, '/preloaded-db/', config.database.filename);

// path to public styles
export const resolveStylesDirectory = join(externalsStartDirectory, config.styles.directory);
export const resolveStylesPath = join(resolveStylesDirectory, config.styles.filename);

export const pathToStartStyles = join(currentDirectory, '/external/styles/', config.styles.filename);

// path to restore file
export const resolveRestoreFile = join(getAppDataPath(), config.restoreFile);
