import { DatabaseModel, ViewSettings } from 'ontime-types';

import { dbModel } from '../../models/dataModel.js';
import { ErrorEmitter } from '../../utils/parserUtils.js';

/**
 * Parse viewSettings portion of a project file
 */
export function parseViewSettings(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): ViewSettings {
  if (!data.viewSettings) {
    emitError?.('No data found to import');
    return { ...dbModel.viewSettings };
  }

  console.log('Found view settings, importing...');

  return {
    dangerColor: data.viewSettings.dangerColor ?? dbModel.viewSettings.dangerColor,
    endMessage: data.viewSettings.endMessage ?? dbModel.viewSettings.endMessage,
    freezeEnd: data.viewSettings.freezeEnd ?? dbModel.viewSettings.freezeEnd,
    normalColor: data.viewSettings.normalColor ?? dbModel.viewSettings.normalColor,
    overrideStyles: data.viewSettings.overrideStyles ?? dbModel.viewSettings.overrideStyles,
    warningColor: data.viewSettings.warningColor ?? dbModel.viewSettings.warningColor,
  };
}
