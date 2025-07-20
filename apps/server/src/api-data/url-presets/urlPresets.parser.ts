import { DatabaseModel, URLPreset } from 'ontime-types';

import { ErrorEmitter } from '../../utils/parserUtils.js';

/**
 * Parse URL preset portion of a project file
 */
export function parseUrlPresets(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): URLPreset[] {
  if (!data.urlPresets) {
    emitError?.('No data found to import');
    return [];
  }

  console.log('Found URL presets, importing...');

  const newPresets: URLPreset[] = [];

  for (const preset of data.urlPresets) {
    if (!preset.alias || !preset.search || !preset.target) {
      emitError?.(`Invalid URL preset: ${JSON.stringify(preset)}`);
      continue;
    }

    const newPreset = {
      enabled: preset.enabled ?? false,
      alias: preset.alias,
      target: preset.target,
      search: preset.search,
    };
    newPresets.push(newPreset);
  }

  console.log(`Uploaded ${newPresets.length} preset(s)`);

  return newPresets;
}
