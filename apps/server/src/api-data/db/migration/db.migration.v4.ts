import { DatabaseModel, Settings } from 'ontime-types';
import { sanitiseAuxTimerNames } from 'ontime-utils';

import { is } from '../../../utils/is.js';
import type { ErrorEmitter } from '../../../utils/parserUtils.js';
import { parseUrlPresets } from '../../url-presets/urlPresets.parser.js';

export function shouldMigrateServerPort(jsonData: object): boolean {
  return (
    is.objectWithKeys(jsonData, ['settings']) &&
    is.object(jsonData.settings) &&
    is.objectWithKeys(jsonData.settings, ['version', 'serverPort']) &&
    typeof jsonData.settings.version === 'string' &&
    jsonData.settings.version.split('.')[0] === '4' &&
    Number(jsonData.settings.version.split('.')[1]) <= 4
  );
}

export function migrateServerPort(jsonData: Partial<DatabaseModel>): {
  db: Partial<DatabaseModel>;
  serverPort?: number;
} {
  const db = structuredClone(jsonData);
  const settings = db.settings as Partial<Settings & { serverPort: number }>;
  const editorKey = settings?.editorKey;
  const operatorKey = settings?.operatorKey;
  const timeFormat = settings?.timeFormat;
  const language = settings?.language;
  const auxTimerNames = sanitiseAuxTimerNames(settings?.auxTimerNames);
  const version = '4.5.0';
  db.settings = {
    version,
    editorKey,
    operatorKey,
    timeFormat,
    language,
    auxTimerNames,
    app: 'ontime',
  } as Settings;
  return { db, serverPort: settings?.serverPort };
}

/** Parse and migrate legacy aliases, flagging changes so project loading preserves a backup. */
export function migrateUrlPresetAliases(jsonData: Partial<DatabaseModel>, emitError?: ErrorEmitter) {
  const urlPresets = parseUrlPresets(jsonData, emitError);
  const originalAliases = new Set(jsonData.urlPresets?.map((preset) => preset.alias));
  const migrated = urlPresets.some((preset) => !originalAliases.has(preset.alias));

  return { urlPresets, migrated };
}
