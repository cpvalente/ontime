import type { CustomFields } from 'ontime-types';

import { isAlphanumericWithSpace } from '../regex-utils/isAlphanumeric.js';

/**
 * @description Transforms a Custom field label into a valid key or returns null if not possible
 */
export const customFieldLabelToKey = (label: string): string | null => {
  if (isAlphanumericWithSpace(label)) {
    return label.trim().replaceAll(' ', '_');
  }
  return null;
};

export const customKeyFromLabel = (label: string, fields: CustomFields): string | null => {
  const maybeMatchingKey = Object.keys(fields).find((key) => fields[key].label === label);
  if (maybeMatchingKey) {
    return maybeMatchingKey;
  }
  return null;
};
