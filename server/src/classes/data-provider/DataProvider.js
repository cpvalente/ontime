import { JSONFile, Low } from 'lowdb';
import { join } from 'path';
import { config } from '../../config/config.js';
import { copyFileSync, existsSync } from 'fs';
import { validateFile } from '../../utils/parserUtils.js';
import { dbModelv1 as dbModel } from '../../models/dataModel.js';
import { parseJson_v1 as parseJson } from '../../utils/parser.js';
import { ensureDirectory, getAppDataPath } from '../../utils/fileManagement.js';

/**
 * Class Event Provider adds functions specific for handling event data
 * It also contains business logic containing to event lists
 */

export class DataProvider {
  /**
   * @description Modules loads ontime db
   * @param runningDirectory
   */
  constructor(runningDirectory) {
    const dbInDisk = DataProvider.populateDb(runningDirectory);

    const adapter = new JSONFile(dbInDisk);
    const db = new Low(adapter);

    db.data = DataProvider.parseDb(dbInDisk, db);
    db.write();
  }

  /**
   * @description Exposes data object
   */
  getData() {
    return this.db.data;
  }

  async setData(newData) {
    this.db.data = newData;
    await this.db.write();
  }

  async updateData(newData) {
    this.db.data = [...this.db.data, newData];
    await this.db.write();
  }

  /**
   * @description Decides which path the database is in
   * @param ensure - whether it should create directory if it doesnt exist
   * @return {string}
   */
  static resolveDbPath(ensure = true) {
    const appPath = getAppDataPath();
    const dbDirectory = join(appPath, config.database.directory);
    if (ensure) {
      ensureDirectory(dbDirectory);
    }
    return join(dbDirectory, config.database.filename);
  }

  /**
   * @description ensures directories exist and populates database
   * @param runningDirectory
   * @return {string}
   */
  static populateDb(runningDirectory) {
    const startupDb = join(runningDirectory, config.database.directory, config.database.filename);
    const dbInDisk = DataProvider.resolveDbPath();

    // if dbInDisk doesnt exist we want to use startup db
    if (!existsSync(dbInDisk)) {
      try {
        copyFileSync(startupDb, dbInDisk);
      } catch (error) {
        console.log(error);
      }
    }

    return dbInDisk;
  }

  /**
   * @description parses a json file to the adapter
   * @param fileToRead
   * @param adapterToUse
   * @return {Promise<number|*>}
   */
  static async parseDb(fileToRead, adapterToUse) {
    if (validateFile(fileToRead)) {
      await adapterToUse.read();
    } else {
      adapterToUse.data = dbModel;
    }

    return parseJson(adapterToUse.data, true);
  }

  /**
   * @description Merges two event data objects
   * @param {object} existing
   * @param {object} newData
   */
  static safeMerge(existing, newData) {
    const mergedData = { ...existing };

    if (typeof newData?.events !== 'undefined') {
      mergedData.events = newData.events;
    }
    if (typeof newData?.event !== 'undefined') {
      mergedData.event = { ...newData.event };
    }
    if (typeof newData?.settings !== 'undefined') {
      mergedData.settings = { ...newData.settings };
    }
    if (typeof newData?.osc !== 'undefined') {
      mergedData.osc = { ...newData.osc };
    }
    if (typeof newData?.http !== 'undefined') {
      mergedData.http = { ...newData.http };
    }
    if (typeof newData?.aliases !== 'undefined') {
      mergedData.aliases = [...newData.aliases];
    }
    if (typeof newData?.userFields !== 'undefined') {
      mergedData.userFields = { ...existing.userFields, ...newData.userFields };
    }
    return mergedData;
  }
}
