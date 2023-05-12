/**
 * Class Event Provider is a mediator for handling the local db
 * and adds logic specific to ontime data
 */
import { EventData, SupportedEvent, ViewSettings } from 'ontime-types';

import { data, db } from '../../modules/loadDb.js';
import { safeMerge } from './DataProvider.utils.js';

export class DataProvider {
  static getData() {
    return data;
  }

  static async setEventData(newData: Partial<EventData>) {
    data.eventData = { ...data.eventData, ...newData };
    await this.persist();
    return data.eventData;
  }

  static getEventData() {
    return data.eventData;
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
    const persistedEvent = data.rundown[eventIndex];
    const newEvent = { ...persistedEvent, ...newData };
    if (newEvent.type === SupportedEvent.Event) {
      newEvent.revision++;
    }
    data.rundown[eventIndex] = newEvent;
    await this.persist();
    return data.rundown[eventIndex];
  }

  static async deleteEvent(eventId) {
    const eventIndex = data.rundown.findIndex((e) => e.id === eventId);

    if (eventIndex !== -1) {
      data.rundown.splice(eventIndex, 1);
      await this.persist();
    }
  }

  static getRundownLength() {
    return data.rundown.length;
  }

  static async clearRundown() {
    data.rundown = [];
    // @ts-expect-error -- not sure how to type, this is library side
    await db.write();
  }

  /**
   * Insets an event after a given index
   * @param entry
   * @param index
   * @return {Promise<void>}
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
   */
  static async insertEventAfterId(entry, id) {
    const index = [...data.rundown].findIndex((event) => event.id === id);
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars -- we are just getting rid of after parameter
    const { after, ...sanitisedEvent } = entry;
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

  static getViewSettings() {
    return { ...data.viewSettings };
  }

  static async setViewSettings(newData: ViewSettings) {
    data.viewSettings = { ...newData };
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
    // @ts-expect-error -- not sure how to type, this is library side
    await db.write();
  }

  static async mergeIntoData(newData) {
    const mergedData = safeMerge(data, newData);
    data.eventData = mergedData.eventData;
    data.settings = mergedData.settings;
    data.viewSettings = mergedData.viewSettings;
    data.osc = mergedData.osc;
    data.aliases = mergedData.aliases;
    data.userFields = mergedData.userFields;
    data.rundown = mergedData.rundown;
    await this.persist();
  }
}
