/**
 * This file handles resolving paths for the server resources
 * There are two main directories
 * - 1. the installation directory, exposed by __dirname
 * - 2. the public directory, exposed by getAppDataPath()
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { config } from './config.js';
import { ensureDirectory } from '../utils/fileManagement.js';
import { isProduction } from './environment.js';

/**
 * Returns public path depending on OS
 * This is the correct path for the app running in production mode
 */
export function getAppDataPath(): string {
  /**
   * If we are running in docker, the ONTIME_DATA environment variable
   * allows moving the public directory to a user defined location
   */
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

/**
 * 1. Paths relative to the installation (or source in development)
 * ------------------------------------------------------------------
 * src/
 * ├─ projects/
 * ├─ external/
 * │  ├─ demo/
 * ├─ user/
 * │  ├─ styles/
 * │  │  ├─ override.css
 * │  ├─ logo/
 * │  │  ├─ logo.png
 */

/** resolve file URL in both CJS and ESM (build and dev) */
if (import.meta.url) {
  globalThis.__dirname = fileURLToPath(import.meta.url);
}

const currentDir = dirname(__dirname);

/**
 * path to server src folder
 * when running in dev, this file is located in src/setup, so we go one level up
 * */
const srcDirectory = isProduction ? currentDir : join(currentDir, '../');

export const srcDir = {
  root: srcDirectory,
  /** Path to the react app */
  clientDir: isProduction ? join(srcDirectory, 'client/') : join(srcDirectory, '../../client/build/'),
  /** Path to the demo app */
  demoDir: join(srcDirectory, 'external', config.demo),
} as const;

export const srcFiles = {
  /** Path to start index.html */
  clientIndexHtml: join(srcDir.clientDir, 'index.html'),
  /** Path to bundled CSS  */
  cssOverride: join(srcDir.root, config.user, config.styles.directory, config.styles.filename),
  /** Path to bundled external readme */
  externalReadme: join(srcDir.root, config.external, 'README.md'),
  /** Path to bundled user readme */
  userReadme: join(srcDir.root, config.user, 'README.md'),
  /** Path to bundled CSS readme */
  cssReadme: join(srcDir.root, config.user, config.styles.directory, 'README.md'),
  /** Path to login */
  login: join(srcDir.root, 'html/login.html'),
};

/**
 * 2. Paths relative to the user public directory
 * ------------------------------------------------
 */

/** Resolve root to public directory */
const resolvePublicDirectory = getAppDataPath();
// Ensure directory tree is created
ensureDirectory(resolvePublicDirectory);

/**
 * Path to external
 * This is unique in the way that we use the src directory in development
 * For simplicity we still bundle this in the public directory object
 */
const externalsStartDirectory = isProduction ? resolvePublicDirectory : join(srcDirectory, 'external');

export const publicDir = {
  root: resolvePublicDirectory,
  /** path to crash reports folder */
  crashDir: join(resolvePublicDirectory, config.crash),
  /** path to projects folder */
  projectsDir: join(resolvePublicDirectory, config.projects),
  /** path to corrupt folder */
  corruptDir: join(resolvePublicDirectory, config.corrupt),
  /** path to migrated folder */
  migrateDir: join(resolvePublicDirectory, config.migrate),
  /** path to uploads folder */
  uploadsDir: join(resolvePublicDirectory, config.uploads),
  /** path to external folder */
  externalDir: join(
    externalsStartDirectory,
    isProduction ? config.external : '', // move to external folder in production
  ),
  /** path to demo project folder */
  demoDir: join(
    externalsStartDirectory,
    isProduction ? '/external/' : '', // move to external folder in production
    config.demo,
  ),
  /** path to user folder */
  userDir: join(resolvePublicDirectory, config.user),
  /** path to external styles override */
  stylesDir: join(resolvePublicDirectory, config.user, config.styles.directory),
  logoDir: join(resolvePublicDirectory, config.user, config.logo),
} as const;

/**
 * Resolve path to specific files
 */
export const publicFiles = {
  /** path to app state file */
  appState: join(publicDir.root, config.appState),
  /** path to restore file */
  restoreFile: join(publicDir.root, config.restoreFile),
  /** path to CSS override file */
  cssOverride: join(publicDir.stylesDir, config.styles.filename),
  /** path to external readme file */
  externalReadme: join(publicDir.externalDir, 'README.md'),
  /** path to user readme file */
  userReadme: join(publicDir.userDir, 'README.md'),
  /** path to CSS readme file */
  cssReadme: join(publicDir.stylesDir, 'README.md'),
} as const;
