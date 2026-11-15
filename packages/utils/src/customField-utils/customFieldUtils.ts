import type { CustomField, CustomFieldKey, CustomFieldOption, CustomFieldType, CustomFields } from 'ontime-types';

import { checkRegex } from '../regex-utils/checkRegex.js';

/** Listing every type here makes adding a type to CustomField fail to compile until it is added */
const typeRecord: Record<CustomFieldType, true> = { text: true, image: true, option: true };
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

const maxOptions = 100;
export const maxCustomFieldOptionLength = 100;

/**
 * Reads an untrusted option list, keeping what can be kept
 * labels are trimmed, empty and repeated labels (ignoring case) are dropped, the order is kept
 */
export function sanitiseCustomFieldOptions(data: unknown): CustomFieldOption[] {
  if (!Array.isArray(data)) return [];
  const options: CustomFieldOption[] = [];
  const seen = new Set<string>();
  for (const option of data) {
    if (options.length === maxOptions) break;
    if (typeof option !== 'object' || option === null || !('label' in option) || typeof option.label !== 'string') {
      continue;
    }
    const label = option.label.trim().slice(0, maxCustomFieldOptionLength);
    const comparable = label.toLowerCase();
    if (label.length === 0 || seen.has(comparable)) continue;
    seen.add(comparable);
    options.push({ label, colour: 'colour' in option && typeof option.colour === 'string' ? option.colour : '' });
  }
  return options;
}

/**
 * Returns an error for an option list a user typed, or null for a valid list
 * The count is not checked, the parser limits it
 */
export function validateCustomFieldOptions(options: Readonly<Pick<CustomFieldOption, 'label'>[]>): string | null {
  if (options.length === 0) return 'Add at least one option';
  const seen = new Set<string>();
  for (const { label } of options) {
    const trimmed = label.trim();
    if (trimmed.length > maxCustomFieldOptionLength) {
      return `Options can be at most ${maxCustomFieldOptionLength} characters`;
    }
    const comparable = trimmed.toLowerCase();
    if (seen.has(comparable)) return `"${trimmed}" is repeated`;
    seen.add(comparable);
  }
  return null;
}

/**
 * Finds the option an entry value picks, values are option labels
 */
export function findCustomFieldOption(field: CustomField, value: string | undefined): CustomFieldOption | undefined {
  if (field.type !== 'option' || !value) return undefined;
  return field.options.find((option) => option.label === value);
}

/**
 * Whether a new value can be written to the field: an option field takes one of its labels, or empty to clear it
 */
export function isValidCustomFieldValue(field: CustomField, value: string): boolean {
  if (field.type !== 'option') return true;
  return value === '' || findCustomFieldOption(field, value) !== undefined;
}
