/**
 * Class Event Provider is a mediator for handling the local db
 * and adds logic specific to ontime data
 */
import { data, db } from '../../app.js';

export class DataProvider {
  static getData() {
    return data;
  }

  static async setEvent(newData) {
    data.event = { ...data.event, ...newData };
    this.persist();
    return data.event;
  }

  static getEvent() {
    return data.event;
  }

  static async setEvents(newData) {
    data.events = [...newData];
    this.persist();
  }

  static getSettings() {
    return data.settings;
  }

  static async setSettings(newData) {
    data.settings = { ...newData };
    this.persist();
  }

  static getOsc() {
    return data.osc;
  }

  static getAliases() {
    return data.aliases;
  }

  static async setAliases(newData) {
    data.aliases = newData;
    this.persist();
  }

  static getUserFields() {
    return { ...data.userFields };
  }

  static getViews() {
    return { ...data.views };
  }

  static setViews(newData) {
    data.views = { ...newData };
    this.persist();
  }

  static async setUserFields(newData) {
    data.userFields = { ...newData };
    this.persist();
  }

  static async setOsc(newData) {
    data.osc = { ...newData };
    this.persist();
  }

  static async persist() {
    await db.write();
  }

  static mergeIntoData(newData) {
    const mergedData = DataProvider.safeMerge(data, newData);
    data.event = mergedData.event;
    data.settings = mergedData.settings;
    data.osc = mergedData.osc;
    data.http = mergedData.http;
    data.aliases = mergedData.aliases;
    data.userFields = mergedData.userFields;
    data.events = mergedData.events;
    this.persist();
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
