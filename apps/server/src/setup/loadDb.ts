import { DatabaseModel } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

import { ensureDirectory, getFileNameFromPath, nameRecovered } from '../utils/fileManagement.js';
import { dbModel } from '../models/dataModel.js';
import { parseProjectFile } from '../services/project-service/projectFileUtils.js';
import { parseJson } from '../utils/parser.js';
import { consoleError, consoleHighlight } from '../utils/console.js';
import { renameProjectFile } from '../services/project-service/ProjectService.js';
import { appStateService } from '../services/app-state-service/AppStateService.js';

import { appStatePath, resolveCorruptedFilesDirectory, resolveDbDirectory, resolveDbName } from './index.js';

/**
 * @description ensures directories exist and populates database
 * @return {string} - path to db file
 */
const populateDb = (directory: string, filename: string): string => {
  ensureDirectory(directory);
  let dbPath = join(directory, filename);

  // if everything goes well, the DB in disk is the one loaded
  // if dbInDisk doesn't exist we create an empty file from db model
  if (!existsSync(dbPath)) {
    try {
      consoleHighlight('No active db found creating empty default');
      const newFileDirectory = join(resolveDbDirectory, 'new empty project.json');
      if (!existsSync(newFileDirectory)) {
        // if it is already there dont override it
        writeFileSync(newFileDirectory, JSON.stringify(dbModel));
      }
      writeFileSync(appStatePath, JSON.stringify({ lastLoadedProject: 'new empty project.json' }));
      dbPath = newFileDirectory;
    } catch (_) {
      /* we do not handle this */
      // TODO: without a DB, the app doesnt work, should we instead let the app crash?
      consoleError('Unable to create DB');
    }
  }
  return dbPath;
};

/**
 * Handles a corrupted file by copying it to a corrupted folder
 * Eventual recovered data will be added to a new file
 */
async function handleCorruptedDb(filePath: string) {
  try {
    const fileName = getFileNameFromPath(filePath);
    const newFilePath = join(resolveCorruptedFilesDirectory, fileName);

    ensureDirectory(resolveCorruptedFilesDirectory);
    copyFileSync(filePath, newFilePath);
    await renameProjectFile(fileName, nameRecovered(fileName));
  } catch (_) {
    /* we do not handle errors here */
  }
}

/**
 * @description loads ontime db
 */
async function loadDb(directory: string, filename: string) {
  const dbInDisk = populateDb(directory, filename);

  let newData: DatabaseModel = dbModel;
  let errors = [];

  try {
    const maybeProjectFile = parseProjectFile(dbInDisk);
    const result = parseJson(maybeProjectFile);

    await appStateService.updateDatabaseConfig(filename);

    newData = result.data;
    errors = result.errors;
  } catch (error) {
    consoleError(`Unable to parse project file: ${getErrorMessage(error)}`);
    handleCorruptedDb(dbInDisk);
  } finally {
    if (errors.length > 0) {
      handleCorruptedDb(dbInDisk);
    }
  }

  const db = await JSONFilePreset<DatabaseModel>(dbInDisk, newData);
  db.data = newData;

  return { db, data: newData };
}

export let db = {} as Low<DatabaseModel>;
export let data = {} as DatabaseModel;
export const dbLoadingProcess = loadDb(resolveDbDirectory, resolveDbName);

/**
 * Initialises database at known location
 */
const init = async () => {
  const dbProvider = await dbLoadingProcess;
  db = dbProvider.db;
  data = dbProvider.data;
};

/**
 * Allows to switch the database to a new file
 */
export const switchDb = async (newFileName: string) => {
  const { db: newDb, data: newData } = await loadDb(resolveDbDirectory, newFileName);
  db = newDb;
  data = newData;
};

init();
