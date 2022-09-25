/**
 * Class Event Provider is a mediator for handling the local db
 * and adds logic specific to ontime data
 */
import { data, db } from '../../app.js';

export class DataProvider {
  static getData() {
    return db.data;
  }

  static async setEvent(newData) {
    data.event = { ...data.event, ...newData };
    this.persist();
    return data.event;
  }

  static getEvent() {
    return db.data.event;
  }

  static async persist() {
    await db.write();
  }

  /**
   * Merges two data objects
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
