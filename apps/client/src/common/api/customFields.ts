import axios from 'axios';
import { CustomField, CustomFieldLabel, CustomFields } from 'ontime-types';

import { apiEntryUrl } from './constants';

const customFieldsPath = `${apiEntryUrl}/custom-fields`;

/**
 * Requests list of known custom fields
 */
export async function getCustomFields(): Promise<CustomFields> {
  const res = await axios.get(customFieldsPath);
  return res.data;
}

/**
 * Sets list of known custom fields
 */
export async function postCustomField(newField: CustomField): Promise<CustomFields> {
  const res = await axios.post(customFieldsPath, { ...newField });
  return res.data;
}

/**
 * Edits single custom field
 */
export async function editCustomField(label: CustomFieldLabel, newField: CustomField): Promise<CustomFields> {
  const res = await axios.put(`${customFieldsPath}/${label}`, { ...newField });
  return res.data;
}

/**
 * Deletes single custom field
 */
export async function deleteCustomField(label: CustomFieldLabel): Promise<CustomFields> {
  const res = await axios.delete(`${customFieldsPath}/${label}`);
  return res.data;
}
