import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { CustomField } from 'ontime-types';

/**
 * Sanitises and creates a custom field in the database
 * @param field
 * @returns
 */
export const createCustomField = async (field: CustomField) => {
  const { label, type, colour } = field;

  // check if label already exists
  const customFields = DataProvider.getCustomFields();
  const alreadyExists = Object.hasOwn(customFields, label);

  if (alreadyExists) {
    throw new Error('Label already exists');
  }

  // update object and persist
  customFields[label] = { label, type, colour };
  const newCustomFields = await DataProvider.setCustomFields(customFields);

  return newCustomFields;
};

/**
 * Object that contains renamings to custom fields
 * Used to rename the custom fields in the events
 * @example
 * {
 *  oldLabel: newLabel
 *  lighting: lx
 * }
 */
const customFieldChangelog = {};

/**
 * Edits an existing custom field in the database
 * @param label
 * @param newField
 * @returns
 */
export const editCustomField = async (label: string, newField: Partial<CustomField>) => {
  const existingFields = DataProvider.getCustomFields();
  if (!(label in existingFields)) {
    throw new Error('Could not find label');
  }

  const existingField = existingFields[label];
  if (existingField.type !== newField.type) {
    throw new Error('Change of field type is not allowed');
  }

  if (existingField.label !== newField.label) {
    customFieldChangelog[label] = newField.label;
  }

  existingFields[label] = { ...existingField, ...newField };

  const newCustomFields = await DataProvider.setCustomFields(existingFields);
  return newCustomFields;
};

/**
 * Deletes a custom field from the database
 * @param label
 */
export const removeCustomField = async (label: string) => {
  const existingFields = DataProvider.getCustomFields();
  if (label in existingFields) {
    delete existingFields[label];
  }

  const newCustomFields = await DataProvider.setCustomFields(existingFields);
  return newCustomFields;
};
