import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { copyFileSync, existsSync } from 'fs';
import { ensureDirectory } from '../utils/fileManagement.js';
import { validateFile } from '../utils/parserUtils.js';
import { dbModel } from '../models/dataModel.js';
import { parseJson } from '../utils/parser.js';
import { reportSentryException } from './sentry.js';
import { currentDirectory, pathToStartDb, resolveDbPath } from '../setup.js';

/**
 * @description ensures directories exist and populates database
 * @return {string} - path to db file
 */
const populateDb = () => {
  const dbInDisk = resolveDbPath();
  ensureDirectory(dbInDisk);

  // if dbInDisk doesn't exist we want to use startup db
  if (!existsSync(dbInDisk)) {
    try {
      copyFileSync(pathToStartDb, dbInDisk);
    } catch (error) {
      reportSentryException(error);
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

  return parseJson(adapterToUse.data, true);
};

/**
 * @description Modules loads ontime db
 * @return {Promise<{data: (*), db: Low<unknown>}>}
 */
async function loadDb() {
  const dbInDisk = populateDb();

  const adapter = new JSONFile(dbInDisk);
  const db = new Low(adapter);

  const data = await parseDb(dbInDisk, db);

  db.data = data;
  await db.write();

  return { db, data };
}

export let db = {};
export let data = {};
export const promise = loadDb();

const init = async () => {
  const dbProvider = await promise;
  db = dbProvider.db;
  data = dbProvider.data;
};

init();
