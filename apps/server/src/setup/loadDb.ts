import { DatabaseModel } from 'ontime-types';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

import { ensureDirectory } from '../utils/fileManagement.js';
import { dbModel } from '../models/dataModel.js';

import { pathToStartDb, resolveDbDirectory, resolveDbName } from './index.js';
import { parseProjectFile } from '../services/project-service/projectFileUtils.js';
import { parseJson } from '../utils/parser.js';

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
      const newFileDirectory = join(dbDirectory, pathToStartDb.split('/').pop());

      copyFileSync(pathToStartDb, newFileDirectory);
      dbPath = newFileDirectory;
    } catch (_) {
      /* we do not handle this */
    }
  }

  return dbPath;
};

/**
 * @description parses a json file to the adapter
 * It will create an empty file from the model if the parsing fails
 */
const parseDatabase = async (fileToRead: string, adapterToUse: Low<DatabaseModel>) => {
  try {
    // this will throw if file is not valid
    parseProjectFile(fileToRead);
    await adapterToUse.read();
  } catch (error) {
    adapterToUse.data = dbModel;
  }

  return parseJson(adapterToUse.data);
};

/**
 * @description loads ontime db
 */
async function loadDb(directory: string, filename: string) {
  const dbInDisk = populateDb(directory, filename);

  const adapter = new JSONFile<DatabaseModel>(dbInDisk);
  const db = new Low(adapter, dbModel);

  const data = await parseDatabase(dbInDisk, db);
  db.data = data;
  await db.write();

  return { db, data };
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
