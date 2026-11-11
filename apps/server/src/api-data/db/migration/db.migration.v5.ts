import type { DatabaseModel } from 'ontime-types';

import { is } from '../../../utils/is.js';

/**
 * Whether the file was saved by an Ontime version before v5, read from settings.version
 * All v5 breaking changes ship together, so the major is the only check we need
 * Runs after the v3 migration, so v3 files reach it already migrated to v4
 */
export function shouldMigrateToV5(jsonData: object): boolean {
  if (
    !is.objectWithKeys(jsonData, ['settings']) ||
    !is.object(jsonData.settings) ||
    !is.objectWithKeys(jsonData.settings, ['version']) ||
    typeof jsonData.settings.version !== 'string'
  ) {
    return false;
  }
  const major = Number(jsonData.settings.version.split('.')[0]);
  return Number.isInteger(major) && major < 5;
}

/**
 * Migrates a project file from v4 to v5
 * - custom fields go from a bare record to { fields, order }
 *   the record lists the fields in the order they were made, which becomes the user defined order
 */
export function migrateToV5(jsonData: Partial<DatabaseModel>): Partial<DatabaseModel> {
  return { ...jsonData, customFields: migrateCustomFields(jsonData.customFields) };
}

function migrateCustomFields(customFields: unknown): DatabaseModel['customFields'] {
  if (!is.object(customFields)) {
    return { fields: {}, order: [] };
  }
  return { fields: customFields, order: Object.keys(customFields) } as DatabaseModel['customFields'];
}
