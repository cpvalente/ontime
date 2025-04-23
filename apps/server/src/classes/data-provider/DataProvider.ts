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
  LogOrigin,
} from 'ontime-types';

import type { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';

import { isPath } from '../../utils/fileManagement.js';
import { shouldCrashDev } from '../../utils/development.js';
import { isTest } from '../../externals.js';

import { safeMerge } from './DataProvider.utils.js';

type ReadonlyPromise<T> = Promise<Readonly<T>>;

let db = {} as Low<DatabaseModel>;

import { publicDir } from '../../setup/index.js';
import { ClassicLevel } from 'classic-level';
import { logger } from '../Logger.js';

const main_db = new ClassicLevel<keyof DatabaseModel, any>(`${publicDir.projectsDir}/db`, {
  valueEncoding: 'json',
});

const rundown_db = main_db.sublevel<string, Rundown>('rundowns', {
  valueEncoding: 'json',
});

/**
 * Initialises the JSON adapter to persist data to a file
 */
export async function initPersistence(filePath: string, fallbackData: DatabaseModel) {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: shouldCrashDev(!isPath(filePath), 'initPersistence should be called with a path');
  const newDb = await JSONFilePreset<DatabaseModel>(filePath, fallbackData);

  const { project, settings, viewSettings, urlPresets, customFields, automation, rundowns } = fallbackData;
  await main_db.open();
  await main_db.put('project', project);
  await main_db.put('settings', settings);
  await main_db.put('viewSettings', viewSettings);
  await main_db.put('urlPresets', urlPresets);
  await main_db.put('customFields', customFields);
  await main_db.put('automation', automation);

  Object.entries(rundowns).forEach(([key, rundown]) => {
    rundown_db.put(key, rundown);
  });

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
    shutdown,
  };
}

function getData(): Readonly<DatabaseModel> {
  return db.data;
}

async function setProjectData(newData: Partial<ProjectData>): ReadonlyPromise<ProjectData> {
  const newProjectData = { ...getProjectData(), ...newData };
  await main_db.put('project', newProjectData);
  return newProjectData;
}

function getProjectData(): ProjectData {
  return main_db.getSync('project') as ProjectData;
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

function getCustomFields(): CustomFields {
  return main_db.getSync('customFields') as CustomFields;
}

async function setRundown(rundownKey: string, newData: Rundown): ReadonlyPromise<Rundown> {
  db.data.rundowns[rundownKey] = newData;
  await persist();
  return db.data.rundowns[rundownKey];
}

function getSettings(): Settings {
  return main_db.getSync('settings') as Settings;
}

async function setSettings(newData: Settings): ReadonlyPromise<Settings> {
  db.data.settings = { ...newData };
  await persist();
  return db.data.settings;
}

function getUrlPresets(): URLPreset[] {
  return main_db.getSync('urlPresets') as URLPreset[];
}

async function setUrlPresets(newData: URLPreset[]): ReadonlyPromise<URLPreset[]> {
  db.data.urlPresets = newData;
  await persist();
  return db.data.urlPresets;
}

function getViewSettings(): ViewSettings {
  return main_db.getSync('viewSettings');
}

async function setViewSettings(newData: ViewSettings): ReadonlyPromise<ViewSettings> {
  db.data.viewSettings = { ...newData };
  await persist();
  return db.data.viewSettings;
}

function getAutomation(): AutomationSettings {
  const automation = main_db.getSync('automation');
  if (!automation) throw new Error('Failed to load automation from db');
  return automation;
}

async function setAutomation(newData: AutomationSettings): ReadonlyPromise<AutomationSettings> {
  db.data.automation = { ...newData };
  await persist();
  return db.data.automation;
}

function getRundown(): Rundown {
  const rundown = rundown_db.getSync('default');
  if (!rundown) throw new Error('Failed to load rundown from db');
  return rundown;
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

async function shutdown() {
  logger.info(LogOrigin.Server, 'Closing DB');
  await main_db.close();
}
