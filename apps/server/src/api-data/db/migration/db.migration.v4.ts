import { DatabaseModel } from 'ontime-types';
import { is } from '../../../utils/is.js';

export function shouldMigrateServerPort(jsonData: object): boolean {
  return (
    is.objectWithKeys(jsonData, ['settings']) &&
    is.object(jsonData.settings) &&
    'serverPort' in jsonData.settings &&
    typeof (jsonData.settings as { serverPort?: unknown }).serverPort === 'number'
  );
}

export function migrateServerPort(jsonData: Partial<DatabaseModel>): Partial<DatabaseModel> {
  const settings = jsonData.settings as { serverPort?: number } & Partial<DatabaseModel['settings']>;
  const serverPort = settings.serverPort;

  if (serverPort !== undefined) {
    const { serverPort: _, ...settingsWithoutPort } = settings;
    return {
      ...jsonData,
      settings: settingsWithoutPort as DatabaseModel['settings'],
    };
  }

  return jsonData;
}
