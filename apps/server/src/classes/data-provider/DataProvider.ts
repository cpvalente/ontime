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

type ReadonlyPromise<T> = Promise<Readonly<T>>;

export class DataProvider {
  static getData() {
    return data;
  }

  static async setProjectData(newData: Partial<ProjectData>): ReadonlyPromise<ProjectData> {
    data.project = { ...data.project, ...newData };
    this.persist();
    return data.project;
  }

  static getProjectData(): Readonly<ProjectData> {
    return data.project;
  }

  static async setCustomFields(newData: CustomFields): ReadonlyPromise<CustomFields> {
    data.customFields = { ...newData };
    this.persist();
    return data.customFields;
  }

  static getCustomFields(): Readonly<CustomFields> {
    return data.customFields;
  }

  static async setRundown(newData: OntimeRundown): ReadonlyPromise<OntimeRundown> {
    data.rundown = [...newData];
    this.persist();
    return data.rundown;
  }

  static getSettings(): Readonly<Settings> {
    return data.settings;
  }

  static async setSettings(newData: Settings): ReadonlyPromise<Settings> {
    data.settings = { ...newData };
    this.persist();
    return data.settings;
  }

  static getOsc(): Readonly<OSCSettings> {
    return data.osc;
  }

  static getHttp(): Readonly<HttpSettings> {
    return data.http;
  }

  static getUrlPresets(): Readonly<URLPreset[]> {
    return data.urlPresets;
  }

  static async setUrlPresets(newData: URLPreset[]): ReadonlyPromise<URLPreset[]> {
    data.urlPresets = newData;
    this.persist();
    return data.urlPresets;
  }

  static getViewSettings(): Readonly<ViewSettings> {
    return data.viewSettings;
  }

  static async setViewSettings(newData: ViewSettings): ReadonlyPromise<ViewSettings> {
    data.viewSettings = { ...newData };
    this.persist();
    return data.viewSettings;
  }

  static async setOsc(newData: OSCSettings): ReadonlyPromise<OSCSettings> {
    data.osc = { ...newData };
    this.persist();
    return data.osc;
  }

  static async setHttp(newData: HttpSettings): ReadonlyPromise<HttpSettings> {
    data.http = { ...newData };
    this.persist();
    return data.http;
  }

  static getRundown(): Readonly<OntimeRundown> {
    return data.rundown;
  }

  private static async persist() {
    if (isTest) {
      return;
    }
    await db.write();
  }

  static async mergeIntoData(newData: Partial<DatabaseModel>): ReadonlyPromise<DatabaseModel> {
    const mergedData = safeMerge(data, newData);
    data.project = mergedData.project;
    data.settings = mergedData.settings;
    data.viewSettings = mergedData.viewSettings;
    data.osc = mergedData.osc;
    data.http = mergedData.http;
    data.urlPresets = mergedData.urlPresets;
    data.customFields = mergedData.customFields;
    data.rundown = mergedData.rundown;

    this.persist();

    return data;
  }
}
