import { CustomField, CustomFieldKey, CustomFields, ProjectCustomFields } from 'ontime-types';
import { checkRegex, customFieldLabelToKey } from 'ontime-utils';

import { is } from '../../utils/is.js';
import type { ErrorEmitter } from '../../utils/parserUtils.js';

/**
 * Parse customFields entry
 */
export function parseCustomFields(data: { customFields?: unknown }, emitError?: ErrorEmitter): CustomFields {
  if (!is.object(data.customFields)) {
    emitError?.('No data found to import');
    return {};
  }
  console.log('Found Custom Fields, importing...');

  const customFields = sanitiseCustomFields(data.customFields);

  if (Object.keys(customFields).length !== Object.keys(data.customFields).length) {
    emitError?.('Skipped invalid custom fields');
  }
  return customFields;
}

/** Parses the collection, including project files saved with a bare field record. */
export function parseProjectCustomFields(
  data: { customFields?: unknown; customFieldOrder?: unknown },
  emitError?: ErrorEmitter,
): ProjectCustomFields {
  const source = data.customFields;
  // Legacy records may contain a field named "fields". Preserve any valid definitions at that level.
  const nested =
    is.object(source) &&
    is.objectWithKeys(source, ['fields']) &&
    is.object(source.fields) &&
    !Object.entries(source).some(([key, field]) => isValidField(field, key));
  const fields = parseCustomFields({ customFields: nested ? source.fields : source }, emitError);
  const order = nested && is.objectWithKeys(source, ['order']) ? source.order : data.customFieldOrder;
  return { fields, order: parseCustomFieldOrder(order, fields) };
}

/**
 * Reconciles a custom field order with the custom fields
 * Keeps the given order for known keys, drops unknown or repeated keys and appends missing fields
 * Projects without an order keep the order of the custom fields object
 */
export function parseCustomFieldOrder(order: unknown, customFields: CustomFields): CustomFieldKey[] {
  const parsed: CustomFieldKey[] = [];
  const seen = new Set<CustomFieldKey>();

  for (const key of Array.isArray(order) ? order : []) {
    if (typeof key === 'string' && Object.hasOwn(customFields, key) && !seen.has(key)) {
      parsed.push(key);
      seen.add(key);
    }
  }

  for (const key of Object.keys(customFields)) {
    if (!seen.has(key)) {
      parsed.push(key);
    }
  }

  return parsed;
}

export function sanitiseCustomFields(data: object): CustomFields {
  const newCustomFields: CustomFields = {};
  for (const [key, field] of Object.entries(data)) {
    if (isValidField(field, key)) {
      newCustomFields[key] = {
        type: field.type,
        colour: field.colour,
        label: field.label,
      };
    }
  }

  return newCustomFields;
}

function isValidField(data: unknown, key: string): data is CustomField {
  return (
    typeof data === 'object' &&
    data !== null &&
    'label' in data &&
    typeof data.label === 'string' &&
    data.label !== '' &&
    'colour' in data &&
    typeof data.colour === 'string' &&
    'type' in data &&
    (data.type === 'text' || data.type === 'image') &&
    checkRegex.isAlphanumericWithSpace(data.label) &&
    key === customFieldLabelToKey(data.label)
  );
}
