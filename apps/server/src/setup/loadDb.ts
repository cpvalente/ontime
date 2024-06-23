import { DatabaseModel } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

import { ensureDirectory, findSafeFileName, getFileNameFromPath, nameRecovered } from '../utils/fileManagement.js';
import { dbModel } from '../models/dataModel.js';
import { parseProjectFile } from '../services/project-service/projectFileUtils.js';
import { parseJson } from '../utils/parser.js';
import { consoleError, consoleHighlight } from '../utils/console.js';
import { renameProjectFile } from '../services/project-service/ProjectService.js';
import { appStateService } from '../services/app-state-service/AppStateService.js';

import { appStatePath, resolveCorruptedFilesDirectory, resolveDbDirectory, resolveDbName } from './index.js';
import { config } from './config.js';
import { demoDb } from '../models/demoProject.js';

async function createNewDb(filename = config.newProjectName, data = dbModel): Promise<string> {
  const newFileDirectory = join(resolveDbDirectory, filename);
  const safeFileDirectory = findSafeFileName(newFileDirectory);

  writeFileSync(safeFileDirectory, JSON.stringify(data));

  const fileName = getFileNameFromPath(safeFileDirectory);
  await appStateService.updateDatabaseConfig(appStatePath, fileName);

  return safeFileDirectory;
}

/**
 * @description ensures directories exist and populates database
 * @return {string} - path to db file
 */
async function populateDb(directory: string, filename: string): Promise<string> {
  ensureDirectory(directory);

  // if we dont have a filename, we load the demo project
  if (!filename) {
    consoleHighlight('No previously loaded file, creating demo project');
    return createNewDb(config.demoProject, demoDb);
  }

  // otherwise we will attempt loading the database
  let dbPath = join(directory, filename);

  // if everything goes well, the DB in disk is the one loaded
  // if dbInDisk doesn't exist we create an empty file from db model
  if (!existsSync(dbPath)) {
    try {
      consoleHighlight('No active DB found, creating new project');
      dbPath = await createNewDb();
    } catch (_) {
      /* we do not handle this */
      // TODO: without a DB, the app doesnt work, should we instead let the app crash?
      consoleError('Unable to create DB');
    }
  }
  return dbPath;
}

/**
 * Handles a corrupted file by copying it to a corrupted folder
 * Eventual recovered data will be added to a new file
 */
async function handleCorruptedDb(filePath: string, canRecover: boolean) {
  try {
    const fileName = getFileNameFromPath(filePath);
    const newFilePath = join(resolveCorruptedFilesDirectory, fileName);

    ensureDirectory(resolveCorruptedFilesDirectory);
    copyFileSync(filePath, newFilePath);
    if (canRecover) {
      await renameProjectFile(fileName, nameRecovered(fileName));
    }
  } catch (_) {
    /* we do not handle errors here */
  }
}

/**
 * @description loads ontime db
 */
async function loadDb(directory: string, filename: string) {
  let dbInDisk = await populateDb(directory, filename);

  let newData: DatabaseModel = dbModel;
  let errors = [];

  try {
    const maybeProjectFile = parseProjectFile(dbInDisk);
    const result = parseJson(maybeProjectFile);

    await appStateService.updateDatabaseConfig(appStatePath, filename);

    newData = result.data;
    errors = result.errors;
  } catch (error) {
    consoleError(`Unable to parse project file: ${getErrorMessage(error)}`);
    // we get here if the JSON file is corrupt
    await handleCorruptedDb(dbInDisk, false);
    dbInDisk = await createNewDb();
  } finally {
    // here we handle whether the data is invalid in the domain level
    if (errors.length > 0) {
      await handleCorruptedDb(dbInDisk, true);
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
