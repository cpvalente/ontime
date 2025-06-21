import { DatabaseModel, isKeyOfType } from 'ontime-types';

export async function makeProjectPatch(data: DatabaseModel, mergeKeys: Record<string, boolean>) {
  const patchObject: Partial<DatabaseModel> = {};

  for (const key in mergeKeys) {
    if (isKeyOfType(key, data) && mergeKeys[key]) {
      // if the rundown is merged we also need the custom fields
      if (key === 'rundowns') {
        patchObject.customFields = data['customFields'];
      }
      Object.assign(patchObject, { [key]: data[key] });
    }
  }

  return patchObject;
}
