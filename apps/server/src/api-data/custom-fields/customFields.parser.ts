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
  const customFields = sanitiseCustomFields(data.customFields);

  if (Object.keys(customFields).length !== Object.keys(data.customFields).length) {
    emitError?.('Skipped invalid custom fields');
  }
  return customFields;
}

/**
 * Parses the collection, including v4 project files saved with a bare field record
 * TODO(v5): move the bare record conversion into a v5 migration step so the parser only reads { fields, order }
 */
export function parseProjectCustomFields(
  data: { customFields?: unknown },
  emitError?: ErrorEmitter,
): ProjectCustomFields {
  const source = data.customFields;
  if (isProjectCustomFields(source)) {
    const fields = parseCustomFields({ customFields: source.fields }, emitError);
    return {
      fields,
      order: parseCustomFieldOrder(is.objectWithKeys(source, ['order']) ? source.order : undefined, fields),
    };
  }
  // v4 files store a bare record, its key order is the field order
  const fields = parseCustomFields({ customFields: source }, emitError);
  return { fields, order: parseCustomFieldOrder(undefined, fields) };
}

/** A v4 record could hold a field labelled "fields", which is a valid field rather than the collection */
function isProjectCustomFields(source: unknown): source is { fields: object; order?: unknown } {
  return (
    is.object(source) &&
    is.objectWithKeys(source, ['fields']) &&
    is.object(source.fields) &&
    !Object.entries(source).some(([key, field]) => isValidField(field, key))
  );
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
