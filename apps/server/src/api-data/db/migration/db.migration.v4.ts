import { DatabaseModel, Settings } from 'ontime-types';
import { is } from '../../../utils/is.js';

export function shouldMigrateServerPort(jsonData: object): boolean {
  return (
    is.objectWithKeys(jsonData, ['settings']) &&
    is.object(jsonData.settings) &&
    is.objectWithKeys(jsonData.settings, ['version', 'serverPort']) &&
    typeof jsonData.settings.version === 'string' &&
    jsonData.settings.version.split('.')[0] === '4'
  );
}

export function migrateServerPort(jsonData: Partial<DatabaseModel>): Partial<DatabaseModel> {
  const newData = structuredClone(jsonData);
  const { settings } = newData;
  const editorKey = settings?.editorKey;
  const operatorKey = settings?.operatorKey;
  const timeFormat = settings?.timeFormat;
  const language = settings?.language;
  const version = settings?.version;
  newData.settings = {
    version,
    editorKey,
    operatorKey,
    timeFormat,
    language,
    app: 'ontime',
  } as Settings;
  return newData;
}
