import { deepEqual } from 'fast-equals';
import { RefetchKey, type Settings } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { auxTimerService } from '../../services/aux-timer-service/auxTimer.service.js';
import { notifyChange } from '../../services/change-service/change.service.js';

/**
 * Gets the stored settings
 */
export function getSettings(): Readonly<Settings> {
  return getDataProvider().getSettings();
}

/**
 * Replaces the stored settings, keeping the stored app version
 */
export async function editSettings(newData: Settings): Promise<Settings> {
  const settings = getDataProvider().getSettings();
  const data = { ...newData, version: settings.version };

  if (deepEqual(data, settings)) {
    return data;
  }

  await getDataProvider().setSettings(data);
  // keep the runtime aux timers in sync so consumers get the new names live
  if (!deepEqual(data.auxTimerNames, settings.auxTimerNames)) {
    auxTimerService.loadNames(data.auxTimerNames);
  }
  notifyChange(RefetchKey.Settings);

  return data;
}
