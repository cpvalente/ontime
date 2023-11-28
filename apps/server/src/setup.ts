import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import fs from 'fs';
import { defaultConfig } from './config/defaultConfig.js';

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

let config;

try {
  config = JSON.parse(fs.readFileSync(join(getAppDataPath(), 'config.json'), 'utf8'));
} catch (err) {
  config = defaultConfig;
}

// path to public db
export const resolveDbDirectory = join(
  testDbStartDirectory,
  isTest ? config.database.testdb : config.database.directory,
);
export const resolveDbPath = join(resolveDbDirectory, config.database.filename);

export const pathToStartDb = isTest
  ? join(currentDirectory, '../', config.database.testdb, 'db.json')
  : join(currentDirectory, '/preloaded-db/', 'db.json');

// path to public styles
export const resolveStylesDirectory = join(externalsStartDirectory, config.styles.directory);
export const resolveStylesPath = join(resolveStylesDirectory, config.styles.filename);

export const pathToStartStyles = join(currentDirectory, '/external/styles/', config.styles.filename);

// path to restore file
export const resolveRestoreFile = join(getAppDataPath(), config.restoreFile);
