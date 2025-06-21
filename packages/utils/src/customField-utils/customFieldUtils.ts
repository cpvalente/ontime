import type { CustomFields } from 'ontime-types';

/**
 * Transforms an alphanumeric label with spaces into a valid key
 */
export function customFieldLabelToKey(label: string): string {
  return label.trim().replaceAll(' ', '_');
}

/**
 * Finds an object key in the CustomFields object that matches the given label
 */
export function customKeyFromLabel(label: string, fields: CustomFields): string | null {
  const maybeMatchingKey = Object.keys(fields).find((key) => fields[key].label === label);
  if (maybeMatchingKey) {
    return maybeMatchingKey;
  }
  return null;
}
