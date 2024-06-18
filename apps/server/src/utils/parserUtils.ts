import { unlink } from 'fs';
import { deepmerge } from 'ontime-utils';

/**
 * @description Ensures variable is string, it skips object types
 * @param val - variable to convert
 * @param {string} [fallback=''] - fallback value
 * @returns {string} - value as string or fallback if not possible
 */
export const makeString = (val: unknown, fallback = ''): string => {
  if (typeof val === 'string') return val;
  else if (val == null || val.constructor === Object) return fallback;
  return val.toString();
};

/**
 * @description Delete file from system
 */
export const deleteFile = async (filePath: string) => {
  unlink(filePath, (error) => {
    if (error) {
      console.error('Could not delete file:', error);
    }
  });
};

/**
 * @description Verifies if object is empty
 * @param {object} obj
 */
export const isEmptyObject = (obj: object) => {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    return Object.keys(obj).length === 0;
  }
  throw new Error('Variable is not an object');
};

/**
 * @description Merges two objects, suppressing undefined keys
 * @param {object} a - any object
 * @param {object} b - a potential partial object of same time as a
 */
export function mergeObject<T extends object>(a: T, b: Partial<T>): T {
  const merged = { ...a };

  for (const key in b) {
    const aValue = a[key];
    const bValue = b[key];

    // ignore keys that do not exist in original object
    if (!Object.hasOwn(merged, key)) {
      continue;
    }

    if (typeof bValue === 'object' && bValue !== null && typeof aValue === 'object' && aValue !== null) {
      // @ts-expect-error -- not sure how to type this
      merged[key] = deepmerge(aValue, bValue);
    } else if (bValue !== undefined) {
      merged[key] = bValue;
    }
  }
  return merged;
}

/**
 * @description Removes undefined
 * @param {object} obj
 */
export const removeUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.keys(obj).reduce((patched, key) => {
    if (typeof obj[key] !== 'undefined') {
      // @ts-expect-error -- not sure how to type this
      patched[key] = obj[key];
    }
    return patched;
  }, {} as Partial<T>);
};
