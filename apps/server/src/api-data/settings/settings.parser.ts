import { DatabaseModel, Settings } from 'ontime-types';

import { getPartialProject } from '../../models/dataModel.js';

/**
 * Parse settings portion of a project file
 */
export function parseSettings(data: Partial<DatabaseModel>): Settings {
  const defaultSettings: Settings = getPartialProject('settings');

  // skip if file definition is missing
  // TODO: skip parsing if the version is not correct
  if (!data.settings || data.settings?.version == null) {
    throw new Error('ERROR: unable to parse settings, missing or incorrect version');
  }

  console.log('Found settings, importing...');

  return {
    version: defaultSettings.version,
    editorKey: data.settings.editorKey ?? defaultSettings.editorKey,
    operatorKey: data.settings.operatorKey ?? defaultSettings.operatorKey,
    timeFormat: data.settings.timeFormat ?? defaultSettings.timeFormat,
    language: data.settings.language ?? defaultSettings.language,
    auxTimerNames: sanitiseAuxTimerNames(data.settings.auxTimerNames, defaultSettings.auxTimerNames),
  };
}

/**
 * Ensures the aux timer names are a fixed-length array of strings
 * regardless of what is found in the file
 */
function sanitiseAuxTimerNames(maybeNames: unknown, fallback: string[]): string[] {
  const source = Array.isArray(maybeNames) ? maybeNames : [];
  return fallback.map((defaultName, index) => {
    const value = source[index];
    return typeof value === 'string' ? value : defaultName;
  });
}
