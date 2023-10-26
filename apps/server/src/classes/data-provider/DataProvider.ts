/**
 * Class Event Provider is a mediator for handling the local db
 * and adds logic specific to ontime data
 */
import { ProjectData, OntimeRundown, ViewSettings } from 'ontime-types';

import { data, db } from '../../modules/loadDb.js';
import { safeMerge } from './DataProvider.utils.js';

export class DataProvider {
  static async getData() {
    return data;
  }

  static async setProjectData(newData: Partial<ProjectData>) {
    data.project = { ...data.project, ...newData };
    await this.persist();
    return data.project;
  }

  static async getProjectData() {
    return data.project;
  }

  static async setRundown(newData: OntimeRundown) {
    data.rundown = [...newData];
    await this.persist();
  }

  static async getIndexOf(eventId: string) {
    return data.rundown.findIndex((e) => e.id === eventId);
  }

  static async getRundownLength() {
    return data.rundown.length;
  }

  static async clearRundown() {
    data.rundown = [];
    await this.persist();
  }

  static async getSettings() {
    return data.settings;
  }

  static async setSettings(newData) {
    data.settings = { ...newData };
    await this.persist();
  }

  static async getOsc() {
    return data.osc;
  }

  static async getAliases() {
    return data.aliases;
  }

  static async setAliases(newData) {
    data.aliases = newData;
    await this.persist();
  }

  static async getUserFields() {
    return { ...data.userFields };
  }

  static async getViewSettings() {
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

  static async getRundown() {
    return [...data.rundown];
  }

  static async persist() {
    // @ts-expect-error -- not sure how to type, this is library side
    await db.write();
  }

  static async mergeIntoData(newData) {
    const mergedData = safeMerge(data, newData);
    data.project = mergedData.project;
    data.settings = mergedData.settings;
    data.viewSettings = mergedData.viewSettings;
    data.osc = mergedData.osc;
    data.aliases = mergedData.aliases;
    data.userFields = mergedData.userFields;
    data.rundown = mergedData.rundown;
    await this.persist();
  }
}
