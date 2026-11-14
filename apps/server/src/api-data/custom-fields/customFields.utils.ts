import type { CustomFields } from 'ontime-types';

/**
 * Merges fields into a list: a field with an existing key replaces it in its position, new fields are appended
 */
export function mergeCustomFieldList(existing: Readonly<CustomFields>, incoming: Readonly<CustomFields>): CustomFields {
  const merged = [...existing];
  for (const field of incoming) {
    const index = merged.findIndex((current) => current.key === field.key);
    if (index === -1) {
      merged.push(field);
    } else {
      merged[index] = field;
    }
  }
  return merged;
}
