import { RefetchKey, type ViewSettings } from 'ontime-types';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

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

  setImmediate(() => {
    sendRefetch(RefetchKey.ViewSettings);
  });

  return viewSettings;
}
