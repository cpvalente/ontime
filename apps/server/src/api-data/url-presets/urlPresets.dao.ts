import { RefetchKey, type URLPreset } from 'ontime-types';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

/**
 * Gets the stored URL presets
 */
export function getUrlPresets(): Readonly<URLPreset[]> {
  return getDataProvider().getUrlPresets();
}

/**
 * Adds a new URL preset
 * @throws if a preset with the same alias exists
 */
export async function addUrlPreset(newPreset: URLPreset): Promise<URLPreset[]> {
  const currentPresets = getDataProvider().getUrlPresets();
  if (currentPresets.some((preset) => preset.alias === newPreset.alias)) {
    throw new Error(`Preset with alias ${newPreset.alias} already exists.`);
  }

  return saveChanges([...currentPresets, newPreset]);
}

/**
 * Replaces an existing URL preset, keeping its options if none are given
 * @throws if the preset does not exist or its alias would change
 */
export async function editUrlPreset(alias: string, newPreset: URLPreset): Promise<URLPreset[]> {
  const currentPresets = getDataProvider().getUrlPresets();
  const existingPreset = currentPresets.find((preset) => preset.alias === alias);
  if (!existingPreset) {
    throw new Error(`Preset with alias ${alias} does not exist.`);
  }

  if (alias !== newPreset.alias) {
    throw new Error('Changing alias is not permitted');
  }

  const updatedPreset: URLPreset = { ...newPreset, options: newPreset.options ?? existingPreset.options };
  return saveChanges(currentPresets.map((preset) => (preset.alias === alias ? updatedPreset : preset)));
}

/**
 * Deletes a URL preset, if it exists
 */
export async function deleteUrlPreset(alias: string): Promise<URLPreset[]> {
  const currentPresets = getDataProvider().getUrlPresets();
  return saveChanges(currentPresets.filter((preset) => preset.alias !== alias));
}

async function saveChanges(newPresets: URLPreset[]): Promise<URLPreset[]> {
  await getDataProvider().setUrlPresets(newPresets);
  sendRefetch(RefetchKey.UrlPresets);
  return newPresets;
}
