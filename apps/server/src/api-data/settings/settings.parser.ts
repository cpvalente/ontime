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
    serverPort: data.settings.serverPort ?? defaultSettings.serverPort,
    editorKey: data.settings.editorKey ?? defaultSettings.editorKey,
    operatorKey: data.settings.operatorKey ?? defaultSettings.operatorKey,
    timeFormat: data.settings.timeFormat ?? defaultSettings.timeFormat,
    language: data.settings.language ?? defaultSettings.language,
  };
}
