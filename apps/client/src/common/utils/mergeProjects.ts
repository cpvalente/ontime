import { DatabaseModel } from 'ontime-types';

import { getDb, patchData } from '../api/db';

export async function mergeProjects(fileName: string, mergeKeys: object) {
  const { data } = await getDb(fileName);
  const patchObject: Partial<DatabaseModel> = {};

  for (const key in mergeKeys) {
    if (isValidKey(key, data)) {
      data[key];
      Object.assign(patchObject, data[key]);
    }
  }
  console.log(patchObject);
  
}

function isValidKey(key: string, obj: DatabaseModel): key is keyof DatabaseModel {
  return key in obj;
}
