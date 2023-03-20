import { copyFileSync, existsSync } from 'fs';
import { pathToStartStyles, resolveStylesDirectory, resolveStylesPath } from '../setup.js';
import { ensureDirectory } from '../utils/fileManagement.js';
import { reportSentryException } from './sentry.js';

/**
 * @description ensures directories exist and populates database
 * @return {string} - path to db file
 */
const populateStyles = () => {
  const stylesInDisk = resolveStylesPath;
  ensureDirectory(resolveStylesDirectory);

  // if dbInDisk doesn't exist we want to use startup db
  if (!existsSync(stylesInDisk)) {
    try {
      copyFileSync(pathToStartStyles, stylesInDisk);
    } catch (error) {
      reportSentryException(error);
    }
  }

  return stylesInDisk;
};

export const populateStylesFile = populateStyles();
