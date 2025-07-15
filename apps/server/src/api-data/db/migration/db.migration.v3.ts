import { ProjectData, Settings, URLPreset, ViewSettings } from 'ontime-types';
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

/**
 * migrates a view settings from v3 to v4
 * - drop `freezeEnd`
 * - drop `endMessage`
 */
export function migrateViewSettings(jsonData: object): ViewSettings | undefined {
  if (is.objectWithKeys(jsonData, ['viewSettings']) && is.object(jsonData.viewSettings)) {
    // intentionally cast as any so we can extract the values
    const oldViewSettings = structuredClone(jsonData.viewSettings) as any;
    const migrated: ViewSettings = {
      dangerColor: oldViewSettings.dangerColor ?? dbModel.viewSettings.dangerColor,
      normalColor: oldViewSettings.normalColor ?? dbModel.viewSettings.normalColor,
      overrideStyles: oldViewSettings.overrideStyles ?? dbModel.viewSettings.overrideStyles,
      warningColor: oldViewSettings.warningColor ?? dbModel.viewSettings.warningColor,
    };
    return migrated;
  }
}

/**
 * migrates a url presets from v3 to v4
 * - nothing changed
 */
export function migrateURLPresets(jsonData: object): URLPreset[] | undefined {
  if (is.objectWithKeys(jsonData, ['urlPresets']) && is.array(jsonData.urlPresets)) {
    const oldURLPresets = structuredClone(jsonData.urlPresets) as URLPreset[];
    return oldURLPresets;
  }
}

/**
 * migrates a url presets from v3 to v4
 * - `backstageUrl` -> `url`
 * - `backstageInfo` -> `info`
 * - drop `publicUrl`
 * - drop `publicInfo`
 * - ensure `logo`
 * - ensure `custom`
 */
export function migrateProjectData(jsonData: object): ProjectData | undefined {
  if (is.objectWithKeys(jsonData, ['project']) && is.object(jsonData.project)) {
    // intentionally cast as any so we can extract the values
    const oldProjectData = structuredClone(jsonData.project) as any;
    const migrated: ProjectData = {
      title: oldProjectData.title ?? dbModel.project.title,
      description: oldProjectData.description ?? dbModel.project.description,
      url: oldProjectData.backstageUrl ?? dbModel.project.url,
      info: oldProjectData.backstageInfo ?? dbModel.project.info,
      logo: oldProjectData.logo ?? dbModel.project.logo,
      custom: oldProjectData.custom ?? dbModel.project.custom,
    };
    return migrated;
  }
}
