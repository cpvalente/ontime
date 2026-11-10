import type { CustomFields, OrderedCustomFields } from 'ontime-types';

/**
 * Lists custom fields as [key, field] pairs
 * The ordered list keeps the project order, a bare record falls back to its key order
 */
export function customFieldEntries(customFields: CustomFields | OrderedCustomFields): OrderedCustomFields {
  return Array.isArray(customFields) ? customFields : Object.entries(customFields);
}
