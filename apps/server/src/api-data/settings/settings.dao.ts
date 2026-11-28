import { deepEqual } from 'fast-equals';
import { RefetchKey, type Settings, type SettingsPatch } from 'ontime-types';

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
 * Applies a partial change to the stored settings: each given field replaces the stored one
 * The stored version is always kept
 */
export async function editSettings(patch: SettingsPatch): Promise<Readonly<Settings>> {
  const settings = getDataProvider().getSettings();
  const data: Settings = { ...settings, ...patch, version: settings.version };

  if (deepEqual(data, settings)) {
    return settings;
  }

  await getDataProvider().setSettings(data);
  // keep the runtime aux timers in sync so consumers get the new names live
  if (!deepEqual(data.auxTimerNames, settings.auxTimerNames)) {
    auxTimerService.loadNames(data.auxTimerNames);
  }
  notifyChange(RefetchKey.Settings);

  return data;
}
