import { CustomField, CustomFields } from 'ontime-types';
import { customFieldLabelToKey, validateCustomFieldLabel } from 'ontime-utils';

import { is } from '../../utils/is.js';
import type { ErrorEmitter } from '../../utils/parserUtils.js';

/**
 * Parses the project custom fields, a list in the user defined order
 * v4 files store a record, the v5 migration converts them before they reach here
 */
export function parseCustomFields(data: { customFields?: unknown }, emitError?: ErrorEmitter): CustomFields {
  if (!is.array(data.customFields)) {
    emitError?.('No data found to import');
    return [];
  }
  const customFields = sanitiseCustomFields(data.customFields);

  if (customFields.length !== data.customFields.length) {
    emitError?.('Skipped invalid custom fields');
  }
  return customFields;
}

/**
 * Keeps the valid fields, dropping repeated keys
 */
export function sanitiseCustomFields(data: unknown[]): CustomFields {
  const newCustomFields: CustomFields = [];
  const seen = new Set<string>();
  for (const field of data) {
    const parsed = parseCustomField(field);
    if (parsed && !seen.has(parsed.key)) {
      newCustomFields.push(parsed);
      seen.add(parsed.key);
    }
  }
  return newCustomFields;
}

/**
 * Parses a single field, copying only the properties of its type
 */
function parseCustomField(data: unknown): CustomField | null {
  if (!is.object(data) || !is.objectWithKeys(data, ['key', 'label', 'colour', 'type'])) {
    return null;
  }
  const { key, label, colour, type } = data;
  if (
    !is.string(key) ||
    !is.string(label) ||
    !is.string(colour) ||
    validateCustomFieldLabel(label) !== null ||
    key !== customFieldLabelToKey(label)
  ) {
    return null;
  }

  // a type with its own settings parses them here, eg: case 'option' would also read the options list
  switch (type) {
    case 'text':
    case 'image':
      return { key, label, colour, type };
    default:
      return null;
  }
}
