/**
 * Class Event Provider is a mediator for handling the local db
 * and adds logic specific to ontime data
 */
import {
  ProjectData,
  OntimeRundown,
  ViewSettings,
  DatabaseModel,
  OSCSettings,
  Settings,
  CustomFields,
  HttpSettings,
  URLPreset,
} from 'ontime-types';

import { data, db } from '../../setup/loadDb.js';
import { safeMerge } from './DataProvider.utils.js';
import { isTest } from '../../setup/index.js';

export class DataProvider {
  static getData() {
    return data;
  }

  static async setProjectData(newData: Partial<ProjectData>) {
    data.project = { ...data.project, ...newData };
    await this.persist();
    return data.project;
  }

  static getProjectData() {
    return data.project;
  }

  static async setCustomFields(newData: CustomFields): Promise<CustomFields> {
    data.customFields = { ...newData };
    await this.persist();
    return data.customFields;
  }

  static getCustomFields(): CustomFields {
    return data.customFields;
  }

  static async setRundown(newData: OntimeRundown) {
    data.rundown = [...newData];
    await this.persist();
  }

  static getSettings(): Readonly<Settings> {
    return data.settings;
  }

  static async setSettings(newData: Settings) {
    data.settings = { ...newData };
    await this.persist();
  }

  static getOsc(): OSCSettings {
    return data.osc;
  }

  static getHttp(): HttpSettings {
    return data.http;
  }

  static getUrlPresets(): URLPreset[] {
    return data.urlPresets;
  }

  static async setUrlPresets(newData: URLPreset[]) {
    data.urlPresets = newData;
    await this.persist();
  }

  static getViewSettings() {
    return { ...data.viewSettings };
  }

  static async setViewSettings(newData: ViewSettings) {
    data.viewSettings = { ...newData };
    await this.persist();
  }

  static async setOsc(newData: OSCSettings): Promise<OSCSettings> {
    data.osc = { ...newData };
    await this.persist();
    return data.osc;
  }

  static async setHttp(newData: HttpSettings): Promise<HttpSettings> {
    data.http = { ...newData };
    await this.persist();
    return data.http;
  }

  static getRundown() {
    return [...data.rundown];
  }

  static async persist() {
    if (isTest) {
      return;
    }
    await db.write();
  }

  static async mergeIntoData(newData: Partial<DatabaseModel>) {
    const mergedData = safeMerge(data, newData);
    data.project = mergedData.project;
    data.settings = mergedData.settings;
    data.viewSettings = mergedData.viewSettings;
    data.osc = mergedData.osc;
    data.http = mergedData.http;
    data.urlPresets = mergedData.urlPresets;
    data.customFields = mergedData.customFields;
    data.rundown = mergedData.rundown;
    await this.persist();
  }
}
