import type { DatabaseModel } from 'ontime-types';

import { is } from '../../../utils/is.js';

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
 */
export function migrateToV5(jsonData: Partial<DatabaseModel>): Partial<DatabaseModel> {
  const record: object = is.object(jsonData.customFields) ? jsonData.customFields : {};
  const customFields = Object.entries(record).map(([key, field]) => ({ ...field, key }));
  return { ...jsonData, customFields };
}
