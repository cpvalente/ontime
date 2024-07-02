import { DatabaseModel } from 'ontime-types';

import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

import { ensureDirectory } from '../utils/fileManagement.js';
import { dbModel } from '../models/dataModel.js';

import { pathToStartDb, resolveDbDirectory, resolveDbName } from './index.js';
import { parseProjectFile } from '../services/project-service/projectFileUtils.js';
import { parseJson } from '../utils/parser.js';
import { getErrorMessage } from 'ontime-utils';
import { appStateProvider } from '../services/app-state-service/AppStateService.js';
import { consoleError } from '../utils/console.js';

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
 * @description loads ontime db
 */
async function loadDb(directory: string, filename: string) {
  const dbInDisk = populateDb(directory, filename);

  // TODO: should this be passed in somewhere?
  let newData: DatabaseModel = dbModel;

  try {
    const maybeProjectFile = await parseProjectFile(dbInDisk);
    const result = parseJson(maybeProjectFile);

    await appStateProvider.setLastLoadedProject(filename);

    newData = result.data;
  } catch (error) {
    consoleError(`Unable to parse project file: ${getErrorMessage(error)}`);
    // we get here if the JSON file is corrupt
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
export const switchDb = async (filePath: string, initialData: DatabaseModel = dbModel) => {
  const newDb = await JSONFilePreset<DatabaseModel>(filePath, initialData);

  // Read the database to initialize it
  await newDb.read();

  db = newDb;
  data = db.data;
};

init();
