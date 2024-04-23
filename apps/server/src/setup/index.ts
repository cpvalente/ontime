import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { config } from './config.js';
import { ensureDirectory } from '../utils/fileManagement.js';

// Determine the current environment settings.
const ENVIRONMENT = process.env.NODE_ENV || 'production';
const IS_TEST = Boolean(process.env.IS_TEST);
const IS_DOCKER = ENVIRONMENT === 'docker';
const IS_PRODUCTION = IS_DOCKER || (ENVIRONMENT === 'production' && !IS_TEST);

// Define global variables for directory handling.
// eslint-disable-next-line prefer-const -- It makes no sense, it is reassigned later.
let appDataPath: string;
let srcDirectory: string;

// Initializes global directory paths based on the environment.
function initializeDirectoryPaths() {
  if (import.meta.url) {
    globalThis.__dirname = dirname(fileURLToPath(import.meta.url));
  }
  srcDirectory = dirname(__dirname);

  // Adjust srcDirectory for production or development environments.
  if (!IS_PRODUCTION) {
    srcDirectory = join(srcDirectory, '../');
  }
}

// Determines the application data path based on the operating system.
function determineAppDataPath() {
  if (process.env.ONTIME_DATA) {
    return process.env.ONTIME_DATA;
  }

  switch (process.platform) {
    case 'darwin':
      return join(process.env.HOME, 'Library', 'Application Support', 'Ontime');
    case 'win32':
      return join(process.env.APPDATA, 'Ontime');
    case 'linux':
      return join(process.env.HOME, '.Ontime');
    default:
      throw new Error('Unsupported platform for resolving the public folder.');
  }
}

// Ensures the app state file exists and is properly initialized.
function ensureAppState() {
  ensureDirectory(appDataPath);
  const appStateFilePath = join(appDataPath, config.appState);
  if (!fs.existsSync(appStateFilePath)) {
    fs.writeFileSync(appStateFilePath, JSON.stringify({ lastLoadedProject: 'db.json' }));
  }
}

// Retrieves the last loaded project from the app state file.
function getLastLoadedProject() {
  const appStateFilePath = join(appDataPath, config.appState);
  try {
    const appState = JSON.parse(fs.readFileSync(appStateFilePath, 'utf8'));
    return appState.lastLoadedProject || 'db.json';
  } catch {
    ensureAppState();
    return 'db.json';
  }
}

// Export functions and constants that resolve paths based on the current environment.
function resolveExternalDirectory() {
  return IS_PRODUCTION ? appDataPath : join(srcDirectory, 'external');
}

function resolveDbDirectory() {
  const baseDir = IS_TEST ? join(srcDirectory, '../') : appDataPath;
  return join(baseDir, IS_TEST ? `../${config.database.testdb}` : config.projects);
}

// Initialize directory paths upon module load.
initializeDirectoryPaths();
appDataPath = determineAppDataPath();

export const environment = {
  isTest: IS_TEST,
  isProduction: IS_PRODUCTION,
  isDocker: IS_DOCKER,
};

export const directories = {
  appDataPath,
  dbDirectory: resolveDbDirectory(),
  externalsStartDirectory: resolveExternalDirectory(),
  externalStylesDirectory: join(resolveExternalDirectory(), 'styles'),
  lastLoadedProject: getLastLoadedProject(),
  projectsDirectory: join(appDataPath, config.projects),
  srcDirectory,
  stylesDirectory: join(appDataPath, config.styles.directory),
  stylesPath: join(appDataPath, config.styles.filename),
};
