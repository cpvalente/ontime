import { DatabaseModel } from 'ontime-types';

import { getDb, patchData } from '../api/db';

export async function mergeProjects(fileName: string, mergeKeys: Record<string, boolean>) {
  const { data } = await getDb(fileName);
  const patchObject: Partial<DatabaseModel> = {};

  for (const key in mergeKeys) {
    if (isValidKey(key, data) && mergeKeys[key]) {
      //if the rundown is merged we also need the custom fields
      if (key === 'rundown') {
        Object.assign(patchObject, { customFields: data['customFields'] });
      }
      Object.assign(patchObject, { [key]: data[key] });
    }
  }
  await patchData(patchObject);
}

function isValidKey(key: string, obj: DatabaseModel): key is keyof DatabaseModel {
  return key in obj;
}
