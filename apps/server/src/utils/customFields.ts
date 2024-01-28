import { CustomFieldDefinitions, CustomInfo } from 'ontime-types';
import { generateId } from 'ontime-utils';
import { DataProvider } from '../classes/data-provider/DataProvider.js';

export const createCustomField = async (field: CustomInfo) => {
  const existingFields = DataProvider.getCustomField();
  if (Object.values(existingFields).findIndex((f) => f[1].label === field.label) >= 0) {
    throw new Error('Label already exists');
  }
  const id = generateId();
  const newField: CustomFieldDefinitions = {};
  Object.assign(newField, { [id]: field });
  await DataProvider.setCustomField(newField);
  return newField;
};

export const editCustomField = async (id: string, field: Partial<CustomInfo>) => {
  const existingFields = DataProvider.getCustomField();
  const existingField = Object.entries(existingFields).find((f) => f[0] === id)[1];
  if (!existingField) {
    throw new Error('Could not find ID');
  }
  const newField: CustomFieldDefinitions = {};
  Object.assign(newField, { [id]: { ...existingField, ...field } });
  await DataProvider.setCustomField(newField);
  return newField;
};

export const removeCustomField = async (id: string) => {
  const existingFields = DataProvider.getCustomField();
  if (!(id in existingFields)) {
    throw new Error('Could not find ID');
  }
  delete existingFields[id];
  await DataProvider.overrideCustomField(existingFields);
};
