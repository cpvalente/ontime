import { DatabaseModel } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

import { ensureDirectory, getFileNameFromPath, nameRecovered } from '../utils/fileManagement.js';
import { dbModel } from '../models/dataModel.js';
import { parseProjectFile } from '../services/project-service/projectFileUtils.js';
import { parseJson } from '../utils/parser.js';
import { consoleError } from '../utils/console.js';
import { renameProjectFile } from '../services/project-service/ProjectService.js';

import { pathToStartDb, resolveCorruptedFilesDirectory, resolveDbDirectory, resolveDbName } from './index.js';

/**
 * @description ensures directories exist and populates database
 * @return {string} - path to db file
 */
const populateDb = (directory: string, filename: string): string => {
  ensureDirectory(directory);
  let dbPath = join(directory, filename);

  // if everything goes well, the DB in disk is the one loaded
  // if dbInDisk doesn't exist we want to use startup db
  if (!existsSync(dbPath)) {
    try {
      const dbDirectory = resolveDbDirectory;
      const startDbName = pathToStartDb.split('/').pop();

      if (!startDbName) {
        throw new Error('Invalid path to start database');
      }

      const newFileDirectory = join(dbDirectory, startDbName);

      copyFileSync(pathToStartDb, newFileDirectory);
      dbPath = newFileDirectory;
    } catch (_) {
      /* we do not handle this */
    }
  }

  return dbPath;
};

/**
 * Handles a corrupted fle by copying it to a corrupted folder
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
