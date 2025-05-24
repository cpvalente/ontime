import { URLPreset } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { hashPassword } from '../../utils/hash.js';

const hashedAliases = new Map<string, string>();

export async function replaceUrlPresets(newPresets: URLPreset[]): Promise<Readonly<URLPreset[]>> {
  // TODO: extract passwords from the new presets and populate cache
  hashedAliases.clear();
  newPresets.forEach((preset) => {
    // console.log(preset.alias + preset.password)
    preset.password && hashedAliases.set(hashPassword(preset.alias + preset.password), preset.alias);
  });
  return await getDataProvider().setUrlPresets(newPresets);
}

export function isValidHashedAlias(hash: string | undefined): boolean {
  if (!hash) {
    return false;
  }
  return hashedAliases.has(hash);
}
