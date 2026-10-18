import { is } from '../../../utils/is.js';

// Keep the legacy boundary independent of DatabaseModel as the v5 schema evolves.
type V4Project = {
  settings: { version: string; [key: string]: unknown };
  customFields?: unknown;
  customFieldOrder?: unknown;
  [key: string]: unknown;
};

export function shouldUseThisMigration(data: object): data is V4Project {
  return (
    is.objectWithKeys(data, ['settings']) &&
    is.object(data.settings) &&
    is.objectWithKeys(data.settings, ['version']) &&
    typeof data.settings.version === 'string' &&
    data.settings.version.split('.')[0] === '4'
  );
}

/** Convert v4 structure to v5; the current project parser validates and normalises the result. */
export function migrateAllData(data: V4Project) {
  const { customFields, customFieldOrder, ...project } = structuredClone(data);
  return {
    ...project,
    settings: { ...project.settings, version: '5.0.0' },
    customFields: { fields: customFields ?? {}, order: customFieldOrder },
  };
}
