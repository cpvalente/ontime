import { isAlphanumericWithSpace } from '../regex-utils/isAlphanumeric.js';

/**
 * @description Transforms a Custom field label into a valid key or returns null if not possible
 * @returns {string | null}
 */
export const customFieldLabelToKey = (label: string): string | null => {
  if (isAlphanumericWithSpace(label)) {
    return label.trim().replaceAll(' ', '_');
  }
  return null;
};
