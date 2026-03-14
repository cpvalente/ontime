import type { CustomFields } from 'ontime-types';

const objectPrototypeKeys = new Set(Object.getOwnPropertyNames(Object.prototype));

/**
 * Transforms an alphanumeric label with spaces into a valid key
 */
export function customFieldLabelToKey(label: string): string {
  return label.trim().replaceAll(' ', '_');
}

/**
 * Detects keys that collide with Object prototype properties or methods
 */
export function isObjectPrototypeKey(key: string): boolean {
  return objectPrototypeKeys.has(key);
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
