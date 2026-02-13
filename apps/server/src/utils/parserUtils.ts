export type ErrorEmitter = (message: string) => void;

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
 * @description Removes undefined
 * @param {object} obj
 */
export const removeUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.keys(obj).reduce<Partial<T>>((patched, key) => {
    if (typeof obj[key] !== 'undefined') {
      // @ts-expect-error -- not sure how to type this
      patched[key] = obj[key];
    }
    return patched;
  }, {});
};
