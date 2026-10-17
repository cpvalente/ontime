import axios from 'axios';
import { CustomField, CustomFieldKey, CustomFields, ProjectCustomFields } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const customFieldsPath = `${apiEntryUrl}/custom-fields`;

/**
 * Requests list of known custom fields with their order
 */
export async function getCustomFields(options?: RequestOptions): Promise<ProjectCustomFields> {
  const res = await axios.get(`${customFieldsPath}/ordered`, { signal: options?.signal });
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
export async function editCustomField(key: CustomFieldKey, newField: CustomField): Promise<CustomFields> {
  const res = await axios.put(`${customFieldsPath}/${key}`, { ...newField });
  return res.data;
}

/**
 * Sets the order of the custom fields
 */
export async function reorderCustomFields(order: CustomFieldKey[]): Promise<ProjectCustomFields> {
  const res = await axios.patch(`${customFieldsPath}/order`, { order });
  return res.data;
}

/**
 * Deletes single custom field
 */
export async function deleteCustomField(key: CustomFieldKey): Promise<CustomFields> {
  const res = await axios.delete(`${customFieldsPath}/${key}`);
  return res.data;
}
