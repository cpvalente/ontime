import { DatabaseModel } from 'ontime-types';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

import { ensureDirectory } from '../utils/fileManagement.js';
import { dbModel } from '../models/dataModel.js';

import { pathToStartDb, resolveDbDirectory, resolveDbPath } from './index.js';
import { parseProjectFile } from '../services/project-service/projectFileUtils.js';
import { parseJson } from '../utils/parser.js';

/**
 * @description ensures directories exist and populates database
 * @return {string} - path to db file
 */
const populateDb = (): string => {
  // if everything goes well, the DB in disk is the one loaded
  let dbInDisk = resolveDbPath;
  ensureDirectory(resolveDbDirectory);

  // if dbInDisk doesn't exist we want to use startup db
  if (!existsSync(dbInDisk)) {
    try {
      const dbDirectory = resolveDbDirectory;
      const newFileDirectory = join(dbDirectory, pathToStartDb.split('/').pop());

      copyFileSync(pathToStartDb, newFileDirectory);
      dbInDisk = newFileDirectory;
    } catch (_) {
      /* we do not handle this */
    }
  }

  return dbInDisk;
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
 * @return {Promise<{data: (*), db: Low<unknown>}>}
 */
async function loadDb() {
  const dbInDisk = populateDb();

  const adapter = new JSONFile<DatabaseModel>(dbInDisk);
  const db = new Low(adapter, dbModel);

  const data = await parseDatabase(dbInDisk, db);
  db.data = data;
  await db.write();

  return { db, data };
}

export let db = {} as Low<DatabaseModel>;
export let data = {} as DatabaseModel;
export const dbLoadingProcess = loadDb();

const init = async () => {
  const dbProvider = await dbLoadingProcess;
  db = dbProvider.db;
  data = dbProvider.data;
};

init();
