import { JSONFile, Low } from 'lowdb';
import { join } from 'path';
import { copyFileSync, existsSync } from 'fs';
import { ensureDirectory, getAppDataPath } from '../utils/fileManagement.js';
import { config } from '../config/config.js';
import { validateFile } from '../utils/parserUtils.js';
import { dbModelv1 as dbModel } from '../models/dataModel.js';
import { parseJson_v1 as parseJson } from '../utils/parser.js';

/**
 * @description ensures directories exist and picks available db path
 * @param runningDirectory
 * @return {string}
 */
const checkDirectories = (runningDirectory) => {
  const appPath = getAppDataPath();
  const dbDirectory = join(appPath, 'data');
  const dbInDisk = join(dbDirectory, config.database.filename);
  const startupDb = join(runningDirectory, 'data', config.database.filename);
  ensureDirectory(dbDirectory);

  // if dbInDisk doesnt exist we want to use startup db
  if (!existsSync(dbInDisk)) {
    try {
      copyFileSync(startupDb, dbInDisk);
    } catch (error) {
      console.log(error);
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
export default async function loadDb(runningDirectory) {
  const dbInDisk = checkDirectories(runningDirectory);

  const adapter = new JSONFile(dbInDisk);
  const db = new Low(adapter);

  const data = await parseDb(dbInDisk, db);

  db.data = data;
  await db.write();

  return { db, data };
}
