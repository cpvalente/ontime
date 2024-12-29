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
  DatabaseOntimeRundown,
} from 'ontime-types';

import type { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';

import { isPath } from '../../utils/fileManagement.js';
import { shouldCrashDev } from '../../utils/development.js';
import { isTest } from '../../externals.js';

import { rundownToDatabaseRundown, safeMerge } from './DataProvider.utils.js';

type ReadonlyPromise<T> = Promise<Readonly<T>>;

let db = {} as Low<DatabaseModel>;

export async function initPersistence(filePath: string, fallbackData: DatabaseModel) {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: shouldCrashDev(!isPath(filePath), 'initPersistence should be called with a path');
  const newDb = await JSONFilePreset<DatabaseModel>(filePath, fallbackData);

  // Read the database to initialize it
  newDb.data = fallbackData;
  await newDb.write();
  await newDb.read();

  db = newDb;
}

export function getDataProvider() {
  if (db === null) throw new Error('Database not initialized');

  return {
    getData,
    setProjectData,
    getProjectData,
    setCustomFields,
    getCustomFields,
    setRundown,
    getSettings,
    setSettings,
    getOsc,
    getHttp,
    getUrlPresets,
    setUrlPresets,
    getViewSettings,
    setViewSettings,
    setOsc,
    setHttp,
    getRundown,
    mergeIntoData,
  };
}

function getData(): Readonly<DatabaseModel> {
  return db.data;
}

async function setProjectData(newData: Partial<ProjectData>): ReadonlyPromise<ProjectData> {
  db.data.project = { ...db.data.project, ...newData };
  await persist();
  return db.data.project;
}

function getProjectData(): Readonly<ProjectData> {
  return db.data.project;
}

async function setCustomFields(newData: CustomFields): ReadonlyPromise<CustomFields> {
  db.data.customFields = { ...newData };
  await persist();
  return db.data.customFields;
}

function getCustomFields(): Readonly<CustomFields> {
  return db.data.customFields;
}

async function setRundown(newData: OntimeRundown): ReadonlyPromise<DatabaseOntimeRundown> {
  db.data.rundown = rundownToDatabaseRundown(newData);
  await persist();
  return db.data.rundown;
}

function getSettings(): Readonly<Settings> {
  return db.data.settings;
}

async function setSettings(newData: Settings): ReadonlyPromise<Settings> {
  db.data.settings = { ...newData };
  await persist();
  return db.data.settings;
}

function getOsc(): Readonly<OSCSettings> {
  return db.data.osc;
}

function getHttp(): Readonly<HttpSettings> {
  return db.data.http;
}

function getUrlPresets(): Readonly<URLPreset[]> {
  return db.data.urlPresets;
}

async function setUrlPresets(newData: URLPreset[]): ReadonlyPromise<URLPreset[]> {
  db.data.urlPresets = newData;
  await persist();
  return db.data.urlPresets;
}

function getViewSettings(): Readonly<ViewSettings> {
  return db.data.viewSettings;
}

async function setViewSettings(newData: ViewSettings): ReadonlyPromise<ViewSettings> {
  db.data.viewSettings = { ...newData };
  await persist();
  return db.data.viewSettings;
}

async function setOsc(newData: OSCSettings): ReadonlyPromise<OSCSettings> {
  db.data.osc = { ...newData };
  await persist();
  return db.data.osc;
}

async function setHttp(newData: HttpSettings): ReadonlyPromise<HttpSettings> {
  db.data.http = { ...newData };
  await persist();
  return db.data.http;
}

function getRundown(): Readonly<DatabaseOntimeRundown> {
  return db.data.rundown;
}

async function mergeIntoData(newData: Partial<DatabaseModel>): ReadonlyPromise<DatabaseModel> {
  const mergedData = safeMerge(db.data, newData);
  db.data.project = mergedData.project;
  db.data.settings = mergedData.settings;
  db.data.viewSettings = mergedData.viewSettings;
  db.data.osc = mergedData.osc;
  db.data.http = mergedData.http;
  db.data.urlPresets = mergedData.urlPresets;
  db.data.customFields = mergedData.customFields;
  db.data.rundown = mergedData.rundown;

  await persist();
  return db.data;
}

/**
 * Handles persisting data to file
 */
async function persist() {
  if (isTest) return;
  await db.write();
}
