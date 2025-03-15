import {
  ProjectData,
  ViewSettings,
  DatabaseModel,
  Settings,
  CustomFields,
  URLPreset,
  AutomationSettings,
  Rundown,
  ProjectRundowns,
} from 'ontime-types';

import type { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';

import { isPath } from '../../utils/fileManagement.js';
import { shouldCrashDev } from '../../utils/development.js';
import { isTest } from '../../externals.js';

import { safeMerge } from './DataProvider.utils.js';

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
    mergeRundown,
    getSettings,
    setSettings,
    getUrlPresets,
    setUrlPresets,
    getViewSettings,
    setViewSettings,
    getAutomation,
    setAutomation,
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

async function mergeRundown(
  newCustomFields: CustomFields,
  newRundowns: ProjectRundowns,
): ReadonlyPromise<{ rundowns: ProjectRundowns; customFields: CustomFields }> {
  db.data.customFields = { ...db.data.customFields, ...newCustomFields };

  Object.entries(newRundowns).forEach(([id, rundown]) => {
    // Note that entries with the same key will be overridden
    db.data.rundowns[id] = rundown;
  });
  await persist();
  return { rundowns: db.data.rundowns, customFields: db.data.customFields };
}

function getCustomFields(): Readonly<CustomFields> {
  return db.data.customFields;
}

async function setRundown(rundownKey: string, newData: Rundown): ReadonlyPromise<Rundown> {
  db.data.rundowns[rundownKey] = newData;
  await persist();
  return db.data.rundowns[rundownKey];
}

function getSettings(): Readonly<Settings> {
  return db.data.settings;
}

async function setSettings(newData: Settings): ReadonlyPromise<Settings> {
  db.data.settings = { ...newData };
  await persist();
  return db.data.settings;
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

function getAutomation(): Readonly<AutomationSettings> {
  return db.data.automation;
}

async function setAutomation(newData: AutomationSettings): ReadonlyPromise<AutomationSettings> {
  db.data.automation = { ...newData };
  await persist();
  return db.data.automation;
}

function getRundown(): Readonly<Rundown> {
  const firstRundown = Object.keys(db.data.rundowns)[0];
  return db.data.rundowns[firstRundown];
}

async function mergeIntoData(newData: Partial<DatabaseModel>): ReadonlyPromise<DatabaseModel> {
  const mergedData = safeMerge(db.data, newData);
  db.data.project = mergedData.project;
  db.data.settings = mergedData.settings;
  db.data.viewSettings = mergedData.viewSettings;
  db.data.automation = mergedData.automation;
  db.data.urlPresets = mergedData.urlPresets;
  db.data.customFields = mergedData.customFields;
  db.data.rundowns = mergedData.rundowns;

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
