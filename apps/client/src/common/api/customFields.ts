import axios from 'axios';
import { CustomFieldKey, CustomFieldPatch, CustomFields, NewCustomField } from 'ontime-types';

import { apiEntryUrl } from './constants';
import type { RequestOptions } from './requestOptions';

const customFieldsPath = `${apiEntryUrl}/custom-fields`;

/**
 * Requests the custom fields, in the project order
 */
export async function getCustomFields(options?: RequestOptions): Promise<CustomFields> {
  const res = await axios.get(customFieldsPath, { signal: options?.signal });
  return res.data;
}

/**
 * Creates a custom field
 */
export async function postCustomField(newField: NewCustomField): Promise<CustomFields> {
  const res = await axios.post(customFieldsPath, { ...newField });
  return res.data;
}

/**
 * Edits single custom field
 */
export async function editCustomField(key: CustomFieldKey, patch: CustomFieldPatch): Promise<CustomFields> {
  const res = await axios.put(`${customFieldsPath}/${key}`, patch);
  return res.data;
}

/**
 * Sets the order of the custom fields
 */
export async function reorderCustomFields(order: CustomFieldKey[]): Promise<CustomFields> {
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
