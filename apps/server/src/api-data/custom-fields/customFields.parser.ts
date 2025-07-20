import { DatabaseModel, CustomFields, CustomField } from 'ontime-types';
import { checkRegex, customFieldLabelToKey } from 'ontime-utils';

import type { ErrorEmitter } from '../../utils/parserUtils.js';

/**
 * Parse customFields entry
 */
export function parseCustomFields(data: Partial<DatabaseModel>, emitError?: ErrorEmitter): CustomFields {
  if (typeof data.customFields !== 'object') {
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

  return newCustomFields;
}
