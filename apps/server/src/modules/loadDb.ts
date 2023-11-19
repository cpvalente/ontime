import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { copyFileSync, existsSync } from 'fs';
import { DatabaseModel } from 'ontime-types';

import { ensureDirectory } from '../utils/fileManagement.js';
import { validateFile } from '../utils/parserUtils.js';
import { dbModel } from '../models/dataModel.js';
import { parseJson } from '../utils/parser.js';
import { pathToStartDb, resolveDbDirectory, resolveDbPath } from '../setup.js';

/**
 * @description ensures directories exist and populates database
 * @return {string} - path to db file
 */
const populateDb = () => {
  const dbInDisk = resolveDbPath;
  ensureDirectory(resolveDbDirectory);

  // if dbInDisk doesn't exist we want to use startup db
  if (!existsSync(dbInDisk)) {
    try {
      copyFileSync(pathToStartDb, dbInDisk);
    } catch (_) {
      /* we do not handle this */
    }
  }

  return dbInDisk;
};

/**
 * @description parses a json file to the adapter
 * @param fileToRead
 * @param adapterToUse
 * @return {Promise<number|*>}
 */
const parseDb = async (fileToRead, adapterToUse) => {
  if (validateFile(fileToRead)) {
    await adapterToUse.read();
  } else {
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
  const db = new Low(adapter);

  const data = await parseDb(dbInDisk, db);
  if (data === null) {
    console.log('ERROR: Invalid JSON format');
    return;
  }

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
