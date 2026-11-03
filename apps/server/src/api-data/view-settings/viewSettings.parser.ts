import { DatabaseModel, ViewSettings } from 'ontime-types';

import { getPartialProject } from '../../models/dataModel.js';
import { ErrorEmitter } from '../../utils/parserUtils.js';

/**
 * Parse viewSettings portion of a project file
 */
export function parseViewSettings(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ViewSettings {
  const defaultViewSettings: ViewSettings = getPartialProject('viewSettings');

  if (!data.viewSettings) {
    emitError?.('No data found to import');
    return defaultViewSettings;
  }

  return {
    dangerColor: data.viewSettings.dangerColor ?? defaultViewSettings.dangerColor,
    normalColor: data.viewSettings.normalColor ?? defaultViewSettings.normalColor,
    overrideStyles: data.viewSettings.overrideStyles ?? defaultViewSettings.overrideStyles,
    warningColor: data.viewSettings.warningColor ?? defaultViewSettings.warningColor,
  };
}
