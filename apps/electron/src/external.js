/**
 * This file contains a list of constants that may need to be resolved at runtime
 */
const path = require('path');

const { version } = require('../package.json');

const electronConfig = require('./electron.config.js');

// external links
const linkToDocs = 'https://docs.getontime.no/';
const linkToGitHub = 'https://github.com/cpvalente/ontime';
const linkToDiscord = 'https://discord.com/invite/eje3CSUEXm';

// environment and platform constants
const env = process.env.NODE_ENV || 'production';
const isProduction = env === 'production';
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';

const releaseTag = `v${version}`;

/** path to server directory */
const nodePath = isProduction
  ? path.join(__dirname, electronConfig.server.pathToEntrypoint)
  : path.join(__dirname, '../../server/dist/index.cjs');

/**
 * Resolves correct URL for client
 * @param {number | undefined} port - the port at which the server is running
 * @returns {string}
 */
const getClientUrl = (port) =>
  isProduction ? electronConfig.reactAppUrl.production(port) : electronConfig.reactAppUrl.development(port);

/**
 * Resolves correct URL for server
 * @param {number | undefined} port - the port at which the server is running
 * @returns {string}
 */
const getServerUrl = (port) => `http://localhost:${port}`;

/** Resolves URL path to download resources */
const downloadPath = '/data/db/';

/** path to tray icon */
const trayIcon = path.join(__dirname, electronConfig.assets.pathToAssets, 'background.png');
/** path to app icon directory */
const appIcon = path.join(__dirname, electronConfig.assets.pathToAssets, 'logo.png');

module.exports = {
  linkToDocs,
  linkToGitHub,
  linkToDiscord,
  env,
  isProduction,
  isMac,
  isWindows,
  releaseTag,
  nodePath,
  getClientUrl,
  getServerUrl,
  downloadPath,
  trayIcon,
  appIcon,
};
