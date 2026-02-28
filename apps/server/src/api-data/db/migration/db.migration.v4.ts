import { DatabaseModel, Settings } from 'ontime-types';
import { is } from '../../../utils/is.js';

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
  const version = '4.5.0';
  db.settings = {
    version,
    editorKey,
    operatorKey,
    timeFormat,
    language,
    app: 'ontime',
  } as Settings;
  return { db, serverPort: settings?.serverPort };
}
