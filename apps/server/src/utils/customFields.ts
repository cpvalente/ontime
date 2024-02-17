import { isAlphanumeric } from 'ontime-utils';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { CustomField } from 'ontime-types';

/**
 * Sanitises and creates a custom field in the database
 * @param label
 * @param field
 * @returns
 */
export const createCustomField = async (label: string, field: string) => {
  if (!isAlphanumeric(label)) {
    throw new Error('Label must be Alphanumeric');
  }

  const customFields = DataProvider.getCustomFields();
  if (Object.keys(customFields).find((f) => f === label) !== undefined) {
    throw new Error('Label already exists');
  }

  Object.assign(customFields, { [label]: { label, field } });
  const newCustomFields = await DataProvider.setCustomFields(customFields);

  return newCustomFields;
};

/**
 * Edits an existing custom field in the database
 * @param label
 * @param field
 * @returns
 */
export const editCustomField = async (label: string, field: Partial<CustomField>) => {
  const existingFields = DataProvider.getCustomFields();
  if (!(label in existingFields)) {
    throw new Error('Could not find label');
  }

  const existingField = existingFields[label];
  if (!existingField) {
    throw new Error('Could not find label');
  }

  existingFields[label] = { ...existingField, ...field };

  const newCustomFields = await DataProvider.setCustomFields(existingFields);
  return newCustomFields;
};

/**
 * Deletes a custom field from the database
 * @param label
 */
export const removeCustomField = async (label: string) => {
  const existingFields = DataProvider.getCustomFields();
  if (!(label in existingFields)) {
    throw new Error('Could not find label');
  }

  delete existingFields[label];

  const newCustomFields = await DataProvider.setCustomFields(existingFields);
  return newCustomFields;
};
