import type { CustomField, CustomFieldKey, CustomFieldType, CustomFields } from 'ontime-types';

import { checkRegex } from '../regex-utils/checkRegex.js';

/** Listing every type here makes adding a type to CustomField fail to compile until it is added */
const typeRecord: Record<CustomFieldType, true> = { text: true, image: true };
export const customFieldTypes = Object.keys(typeRecord) as CustomFieldType[];

/** Keys an entry's custom values would resolve through the prototype, or which would change the prototype itself */
const reservedKeys = new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']);

/**
 * Transforms an alphanumeric label with spaces into a valid key
 */
export function customFieldLabelToKey(label: string): string {
  return label.trim().replaceAll(' ', '_');
}

/**
 * Returns a validation error, or null for a valid label
 * Labels become keys used in integrations and templates, so they are limited to letters, numbers, spaces and underscores
 */
export function validateCustomFieldLabel(label: string): string | null {
  const trimmed = label.trim();
  if (trimmed.length === 0) return 'Label cannot be empty';
  if (!checkRegex.isAlphanumericWithSpace(trimmed))
    return 'Label can only contain letters, numbers, spaces and underscores';
  if (reservedKeys.has(customFieldLabelToKey(trimmed))) return `"${trimmed}" is a reserved name`;
  return null;
}

/**
 * Finds the custom field with the given key
 */
export function findCustomField(fields: Readonly<CustomFields>, key: CustomFieldKey): CustomField | undefined {
  return fields.find((field) => field.key === key);
}

/**
 * The project custom fields by key, for checking entry values against them
 */
export function getCustomFieldsByKey(fields: Readonly<CustomFields>): Map<CustomFieldKey, CustomField> {
  return new Map(fields.map((field) => [field.key, field]));
}

/**
 * Sorts the fields by the given keys, fields left out keep their relative order at the end
 */
export function sortCustomFields(fields: Readonly<CustomFields>, order: CustomFieldKey[]): CustomFields {
  const position = new Map(order.map((key, index) => [key, index]));
  const rank = (key: CustomFieldKey) => position.get(key) ?? order.length;
  return fields.toSorted((a, b) => rank(a.key) - rank(b.key));
}
