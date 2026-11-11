import { is } from '../../../utils/is.js';

const v5Major = 5;

/**
 * The major of the Ontime version which saved the file, read from settings.version
 * v5 breaking changes add their own migration here, which checks the shape of the data
 * so files saved by earlier 5.0 prereleases are also migrated
 */
function getMajor(jsonData: object): number | null {
  if (
    is.objectWithKeys(jsonData, ['settings']) &&
    is.object(jsonData.settings) &&
    is.objectWithKeys(jsonData.settings, ['version']) &&
    typeof jsonData.settings.version === 'string'
  ) {
    const major = Number(jsonData.settings.version.split('.')[0]);
    return Number.isInteger(major) ? major : null;
  }
  return null;
}

/**
 * Whether the file was saved by an older major
 * Runs after the v3 migration, so v3 files reach it already migrated to v4
 */
export function isFromOlderMajor(jsonData: object): boolean {
  const major = getMajor(jsonData);
  return major !== null && major < v5Major;
}

/** Whether the file was saved by a newer major, which this version cannot understand */
export function isFromNewerMajor(jsonData: object): boolean {
  const major = getMajor(jsonData);
  return major !== null && major > v5Major;
}
