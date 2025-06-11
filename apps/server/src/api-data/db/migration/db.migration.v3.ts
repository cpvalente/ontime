import { Settings, ViewSettings } from 'ontime-types';
import { ONTIME_VERSION } from '../../../ONTIME_VERSION.js';
import { is } from '../../../utils/is.js';
import { dbModel } from '../../../models/dataModel.js';

// the methodology of the migrations is to just change the necessary keys to match with v4
// and then let the normal project parser handle ensuring the the file is correct 

/**
 * migrates a settings from v3 to v4
 * - update the version number
 */
export function migrateSettings(jsonData: object): Settings | undefined {
  if (is.objectWithKeys(jsonData, ['settings']) && is.object(jsonData.settings)) {
    // intentionally cast as any so we can extract the values
    const oldSettings = structuredClone(jsonData.settings) as any;
    const migrated: Settings = {
      version: ONTIME_VERSION,
      serverPort: oldSettings.serverPort ?? dbModel.settings.serverPort,
      editorKey: oldSettings.editorKey ?? dbModel.settings.editorKey,
      operatorKey: oldSettings.operatorKey ?? dbModel.settings.operatorKey,
      timeFormat: oldSettings.timeFormat ?? dbModel.settings.timeFormat,
      language: oldSettings.language ?? dbModel.settings.language,
    };
    return migrated;
  }
}

