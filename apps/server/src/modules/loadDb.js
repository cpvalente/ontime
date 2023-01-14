import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { dirname, join } from 'path';
import { copyFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { ensureDirectory, getAppDataPath } from '../utils/fileManagement.js';
import { config } from '../config/config.js';
import { validateFile } from '../utils/parserUtils.js';
import { dbModel } from '../models/dataModel.js';
import { parseJson } from '../utils/parser.js';
import { reportSentryException } from './sentry.js';

/**
 * @description Decides which path the database is in
 * @param ensure - whether it should create directory if it doesnt exist
 * @return {string}
 */
export const resolveDbPath = (ensure = true) => {
  const appPath = getAppDataPath();
  const dbDirectory = join(appPath, config.database.directory);
  if (ensure) {
    ensureDirectory(dbDirectory);
  }
  return join(dbDirectory, config.database.filename);
};

/**
 * @description ensures directories exist and populates database
 * @param runningDirectory
 * @return {string}
 */
const populateDb = (runningDirectory) => {
  const startupDb = join(runningDirectory, config.database.directory, config.database.filename);
  const dbInDisk = resolveDbPath();

  // if dbInDisk doesnt exist we want to use startup db
  if (!existsSync(dbInDisk)) {
    try {
      copyFileSync(startupDb, dbInDisk);
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
 * @param runningDirectory
 * @return {Promise<{data: (number|*), db: Low<unknown>}>}
 */
async function loadDb(runningDirectory) {
  const dbInDisk = populateDb(runningDirectory);

  const adapter = new JSONFile(dbInDisk);
  const db = new Low(adapter);

  const data = await parseDb(dbInDisk, db);

  db.data = data;
  await db.write();

  return { db, data };
}

const filename = fileURLToPath(import.meta.url);
export const dbDirectory = dirname(join(filename, '../'));

export let db = {};
export let data = {};
export const promise = loadDb(dbDirectory);

const init = async () => {
  const dbProvider = await promise;
  db = dbProvider.db;
  data = dbProvider.data;
};

init();
