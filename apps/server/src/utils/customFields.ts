import { CustomFieldDefinitions, CustomInfo } from 'ontime-types';
import { isAlphanumeric } from 'ontime-utils';
import { DataProvider } from '../classes/data-provider/DataProvider.js';

export const createCustomField = async (label: string, field: CustomInfo) => {
  if (!isAlphanumeric(label)) {
    throw new Error('Lable must be Alphanumeric');
  }
  const customFields = DataProvider.getCustomField();
  if (Object.keys(customFields).find((f) => f === label) !== undefined) {
    throw new Error('Label already exists');
  }
  Object.assign(customFields, { [label]: field });
  await DataProvider.setCustomField(customFields);
  return customFields;
};

export const editCustomField = async (label: string, field: Partial<CustomInfo>) => {
  const existingFields = DataProvider.getCustomField();
  const existingField = Object.entries(existingFields).find((f) => f[0] === label)[1];
  if (!existingField) {
    throw new Error('Could not find label');
  }
  const newField: CustomFieldDefinitions = {};
  Object.assign(newField, { [label]: { ...existingField, ...field } });
  await DataProvider.setCustomField(newField);
  return newField;
};

export const removeCustomField = async (label: string) => {
  const existingFields = DataProvider.getCustomField();
  if (!(label in existingFields)) {
    throw new Error('Could not find label');
  }
  delete existingFields[label];
  await DataProvider.setCustomField(existingFields);
};
