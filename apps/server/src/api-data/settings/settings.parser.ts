import { DatabaseModel, Settings } from 'ontime-types';

import { dbModel } from '../../models/dataModel.js';

/**
 * Parse settings portion of a project file
 */
export function parseSettings(data: Partial<DatabaseModel>): Settings {
  // skip if file definition is missing
  // TODO: skip parsing if the version is not correct
  if (!data.settings || data.settings?.version == null) {
    throw new Error('ERROR: unable to parse settings, missing or incorrect version');
  }

  console.log('Found settings, importing...');

  return {
    version: dbModel.settings.version,
    serverPort: data.settings.serverPort ?? dbModel.settings.serverPort,
    editorKey: data.settings.editorKey ?? null,
    operatorKey: data.settings.operatorKey ?? null,
    timeFormat: data.settings.timeFormat ?? '24',
    language: data.settings.language ?? 'en',
  };
}
