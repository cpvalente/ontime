import { getCurrentRundown } from '../api-data/rundown/rundown.dao.js';
import { initRundown } from '../api-data/rundown/rundown.service.js';
import { normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';

/** Returns the standard rundown list payload used by rundown management tool responses */
export function rundownListResponse() {
  const loaded = getCurrentRundown().id;
  const rundowns = normalisedToRundownArray(getDataProvider().getProjectRundowns());
  return { loaded, rundowns };
}

/** Renames a rundown and reinitialises runtime state if it is currently loaded */
export async function renameRundown(id: string, title: string) {
  const dataProvider = getDataProvider();
  const rundown = dataProvider.getRundown(id);
  if (!rundown) throw new Error(`Rundown ${id} not found`);
  await dataProvider.setRundown(id, { ...rundown, title });
  if (id === getCurrentRundown().id) {
    await initRundown(dataProvider.getRundown(id), dataProvider.getCustomFields());
  }
  return rundownListResponse();
}

/** Deletes a rundown, guarding against deleting the active or the last remaining rundown */
export async function deleteRundown(id: string) {
  if (id === getCurrentRundown().id) {
    throw new Error('Cannot delete the currently loaded rundown');
  }
  const dataProvider = getDataProvider();
  if (Object.keys(dataProvider.getProjectRundowns()).length <= 1) {
    throw new Error('Cannot delete the last rundown');
  }
  await dataProvider.deleteRundown(id);
  return rundownListResponse();
}
