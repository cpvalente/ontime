import { is } from '../../../utils/is.js';

// Keep the legacy boundary independent of DatabaseModel as the v5 schema evolves.
type V4Project = {
  settings: { version: string; [key: string]: unknown };
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

/** Add structural v4-to-v5 conversions here before stamping the target version. */
export function migrateAllData(data: V4Project) {
  const project = structuredClone(data);
  return {
    ...project,
    settings: { ...project.settings, version: '5.0.0' },
  };
}
