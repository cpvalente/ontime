/**
 * Class Event Provider is a mediator for handling the local db
 * and adds logic specific to ontime data
 */
import { db, data } from '../../modules/loadDb.js';

export class DataProvider {
  static getData() {
    return data;
  }

  static async setEventData(newData) {
    data.event = { ...data.event, ...newData };
    await this.persist();
    return data.event;
  }

  static getEventData() {
    return data.event;
  }

  static async setRundown(newData) {
    data.rundown = [...newData];
    await this.persist();
  }

  static getEventById(eventId) {
    return data.rundown.find((e) => e.id === eventId);
  }

  static async updateEventById(eventId, newData) {
    const eventIndex = data.rundown.findIndex((e) => e.id === eventId);
    const e = data.rundown[eventIndex];
    data.rundown[eventIndex] = { ...e, ...newData };
    data.rundown[eventIndex].revision++;
    await this.persist();
    return data.rundown[eventIndex];
  }

  static async deleteEvent(eventId) {
    data.rundown = Array.from(data.rundown).filter((e) => e.id !== eventId);
    await this.persist();
  }

  static getNumEvents() {
    return data.rundown.length;
  }

  static async clearRundown() {
    data.rundown = [];
    await db.write();
  }

  /**
   * Insets an event after a given index
   * @param entry
   * @param index
   * @return {Promise<void>}
   * @private
   */
  static async insertEventAt(entry, index) {
    // get events
    const events = DataProvider.getRundown();
    const count = events.length;
    const order = entry.order;

    // Remove order field from object
    delete entry.order;

    // Insert at beginning
    if (order === 0) {
      events.unshift(entry);
    }

    // insert at end
    else if (order >= count) {
      events.push(entry);
    }

    // insert in the middle
    else {
      events.splice(index, 0, entry);
    }

    // save events
    await DataProvider.setRundown(events);
  }

  /**
   * @description Inserts an entry after an element with given ID
   * @param entry
   * @param id
   * @return {Promise<void>}
   * @private
   */
  static async insertEventAfterId(entry, id) {
    const index = [...data.rundown].findIndex((event) => event.id === id);
    // eslint-disable-next-line no-unused-vars
    const { _after, ...sanitisedEvent } = entry;
    await DataProvider.insertEventAt(sanitisedEvent, index + 1);
  }

  static getSettings() {
    return data.settings;
  }

  static async setSettings(newData) {
    data.settings = { ...newData };
    await this.persist();
  }

  static getOsc() {
    return data.osc;
  }

  static getAliases() {
    return data.aliases;
  }

  static async setAliases(newData) {
    data.aliases = newData;
    await this.persist();
  }

  static getUserFields() {
    return { ...data.userFields };
  }

  static getViews() {
    return { ...data.views };
  }

  static async setViews(newData) {
    data.views = { ...newData };
    await this.persist();
  }

  static async setUserFields(newData) {
    data.userFields = { ...newData };
    await this.persist();
  }

  static async setOsc(newData) {
    data.osc = { ...newData };
    await this.persist();
  }

  static getRundown() {
    return [...data.rundown];
  }

  static async persist() {
    await db.write();
  }

  static async mergeIntoData(newData) {
    const mergedData = DataProvider.safeMerge(data, newData);
    data.event = mergedData.event;
    data.settings = mergedData.settings;
    data.osc = mergedData.osc;
    data.http = mergedData.http;
    data.aliases = mergedData.aliases;
    data.userFields = mergedData.userFields;
    data.rundown = mergedData.rundown;
    await this.persist();
  }

  /**
   * Merges two data objects
   * @param {object} existing
   * @param {object} newData
   */
  static safeMerge(existing, newData) {
    const mergedData = { ...existing };

    if (typeof newData?.rundown !== 'undefined') {
      mergedData.rundown = newData.rundown;
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
