import { RefetchKey, type ViewSettings } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { notifyChange } from '../../services/change-service/change.service.js';

/**
 * Gets the stored view settings
 */
export function getViewSettings(): Readonly<ViewSettings> {
  return getDataProvider().getViewSettings();
}

/**
 * Replaces the stored view settings
 */
export async function editViewSettings(newData: ViewSettings): Promise<Readonly<ViewSettings>> {
  const viewSettings = await getDataProvider().setViewSettings(newData);

  notifyChange(RefetchKey.ViewSettings);

  return viewSettings;
}

/**
 * Turns the css override on or off, leaving other view settings as they are
 */
export async function setOverrideStyles(overrideStyles: boolean): Promise<Readonly<ViewSettings>> {
  const viewSettings = getViewSettings();
  if (viewSettings.overrideStyles === overrideStyles) return viewSettings;
  return editViewSettings({ ...viewSettings, overrideStyles });
}
