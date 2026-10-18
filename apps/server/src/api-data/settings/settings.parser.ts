import { DatabaseModel, Settings } from 'ontime-types';
import { sanitiseAuxTimerNames } from 'ontime-utils';

import { getPartialProject } from '../../models/dataModel.js';

/**
 * Parse settings portion of a project file
 */
export function parseSettings(data: Partial<DatabaseModel>): Settings {
  const defaultSettings: Settings = getPartialProject('settings');

  if (!data.settings || typeof data.settings.version !== 'string') {
    throw new Error('ERROR: unable to parse settings, missing or incorrect version');
  }

  if (data.settings.version.split('.')[0] !== defaultSettings.version.split('.')[0]) {
    throw new Error(`Unsupported project version: ${data.settings.version}`);
  }

  console.log('Found settings, importing...');

  return {
    version: defaultSettings.version,
    editorKey: data.settings.editorKey ?? defaultSettings.editorKey,
    operatorKey: data.settings.operatorKey ?? defaultSettings.operatorKey,
    timeFormat: data.settings.timeFormat ?? defaultSettings.timeFormat,
    language: data.settings.language ?? defaultSettings.language,
    auxTimerNames: sanitiseAuxTimerNames(data.settings.auxTimerNames),
  };
}
