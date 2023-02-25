import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import { config } from './config/config.js';

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
export const isProduction = env === 'production' && !isTest;

// =================================================
// resolve path to external
const productionPath = '../../Resources/extraResources/client';
const devPath = '../../client/build/';

export const resolvedPath = (): string => (isProduction ? productionPath : devPath);

// resolve file URL in both CJS and ESM (build and dev)
if (import.meta.url) {
  globalThis.__dirname = fileURLToPath(import.meta.url);
}

// path to server src folder
export const currentDirectory = dirname(__dirname);

const appPath = isTest ? '../' : getAppDataPath();

// path to public db
export const resolveDbDirectory = join(appPath, isTest ? config.database.testdb : config.database.directory);
export const resolveDbPath = join(resolveDbDirectory, config.database.filename);

export const pathToStartDb = isTest
  ? join(currentDirectory, '../', config.database.testdb, config.database.filename)
  : join(currentDirectory, config.database.directory, config.database.filename);
