import { JSONFile, Low } from 'lowdb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ensureDirectory, getAppDataPath } from '../utils/fileManagement.js';
import { config } from '../config/config.js';
import { validateFile } from '../utils/parserUtils.js';
import { dbModelv1 as dbModel } from '../models/dataModel.js';
import { parseJson_v1 as parseJson } from '../utils/parser.js';

export default async function loadDb() {
  const { __dirname, dbInDisk } = checkDirectories();

  const adapter = new JSONFile(dbInDisk);
  const db = new Low(adapter);

  const data = await parseDb(dbInDisk, db);

  db.data = data;
  await db.write();

  return { __dirname, db, data };
}

/**
 * @description ensures directories exist and picks available db path
 * @return {{__dirname: string, dbInDisk: string}}
 */
const checkDirectories = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const appPath = getAppDataPath();
  const dbDirectory = join(appPath, 'data');
  const dbInDisk = join(dbDirectory, config.database.filename);
  const startupDb = join(__dirname, 'data', config.database.filename);
  ensureDirectory(dbDirectory);

  return { __dirname, dbInDisk };
};

const parseDb = async (fileToRead, adapterToUse) => {
  if (validateFile(fileToRead)) {
    await adapterToUse.read();
  } else {
    adapterToUse.data = dbModel;
  }

  return await parseJson(adapterToUse.data, true);
};
