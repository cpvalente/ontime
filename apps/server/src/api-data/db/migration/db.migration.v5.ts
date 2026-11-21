import type { DatabaseModel } from 'ontime-types';

import { is } from '../../../utils/is.js';

const v4DefaultWarning = 120000;
const v4DefaultDanger = 60000;

/**
 * Whether the custom fields are still a record by key, as saved before v5
 * Runs after the v3 migration, so v3 files reach it already migrated to v4
 */
export function shouldMigrateToV5(jsonData: Partial<DatabaseModel>): boolean {
  return is.object(jsonData.customFields);
}

/**
 * Migrates a project file from v4 to v5
 * - custom fields go from a record by key to a list, each field holding its key
 *   the record lists the fields in the order they were made, which becomes the user defined order
 * - event warning and danger times at the 4.x defaults inherit the project thresholds, which start at the same values
 */
export function migrateToV5(jsonData: Partial<DatabaseModel>): Partial<DatabaseModel> {
  const record: object = is.object(jsonData.customFields) ? jsonData.customFields : {};
  const customFields = Object.entries(record).map(([key, field]) => ({ ...field, key }));
  const migrated: Partial<DatabaseModel> = { ...jsonData, customFields };
  if (is.object(jsonData.rundowns)) {
    migrated.rundowns = mapObject(jsonData.rundowns, inheritDefaultThresholds) as DatabaseModel['rundowns'];
  }
  return migrated;
}

function mapObject(value: object, transform: (entry: unknown) => unknown): object {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, transform(entry)]));
}

function inheritDefaultThresholds(rundown: unknown): unknown {
  if (!is.object(rundown) || !is.objectWithKeys(rundown, ['entries']) || !is.object(rundown.entries)) return rundown;
  return { ...rundown, entries: mapObject(rundown.entries, inheritDefaultEventThresholds) };
}

function inheritDefaultEventThresholds(entry: unknown): unknown {
  if (!is.object(entry) || !is.objectWithKeys(entry, ['type']) || entry.type !== 'event') return entry;
  const { timeWarning, timeDanger } = entry as { timeWarning?: unknown; timeDanger?: unknown };
  return {
    ...entry,
    timeWarning: timeWarning === v4DefaultWarning ? null : timeWarning,
    timeDanger: timeDanger === v4DefaultDanger ? null : timeDanger,
  };
}
