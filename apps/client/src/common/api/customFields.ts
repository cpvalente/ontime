import axios from 'axios';
import { CustomField, CustomFieldKey } from 'ontime-types'; // Removed CustomFields

import { apiEntryUrl } from './constants';

// Define CustomFieldWithKey for client-side usage
export type CustomFieldWithKey = CustomField & { key: CustomFieldKey };

const customFieldsPath = `${apiEntryUrl}/custom-fields`;

/**
 * Requests list of known custom fields, sorted by order
 */
export async function getCustomFields(): Promise<CustomFieldWithKey[]> {
  const res = await axios.get<CustomFieldWithKey[]>(customFieldsPath);
  return res.data;
}

/**
 * Sets list of known custom fields
 * Returns the updated list, sorted by order
 */
export async function postCustomField(newField: CustomField): Promise<CustomFieldWithKey[]> {
  const res = await axios.post<CustomFieldWithKey[]>(customFieldsPath, { ...newField });
  return res.data;
}

/**
 * Edits single custom field
 * Returns the updated list, sorted by order
 */
export async function editCustomField(key: CustomFieldKey, newField: Partial<CustomField>): Promise<CustomFieldWithKey[]> {
  // Ensure newField can include 'order' by using Partial<CustomField>
  const res = await axios.put<CustomFieldWithKey[]>(`${customFieldsPath}/${key}`, { ...newField });
  return res.data;
}

/**
 * Deletes single custom field
 * Returns the updated list, sorted by order
 */
export async function deleteCustomField(key: CustomFieldKey): Promise<CustomFieldWithKey[]> {
  const res = await axios.delete<CustomFieldWithKey[]>(`${customFieldsPath}/${key}`);
  return res.data;
}
