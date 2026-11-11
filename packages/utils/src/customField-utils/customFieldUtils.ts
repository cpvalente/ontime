import type { CustomFields } from 'ontime-types';

/** Keys a field record would resolve through the prototype, or which would change the prototype itself */
const reservedKeys = new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']);

/**
 * Transforms an alphanumeric label with spaces into a valid key
 */
export function customFieldLabelToKey(label: string): string {
  return label.trim().replaceAll(' ', '_');
}

/**
 * Whether a custom field key collides with an Object prototype property, eg: __proto__ or toString
 */
export function isReservedCustomFieldKey(key: string): boolean {
  return reservedKeys.has(key);
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
