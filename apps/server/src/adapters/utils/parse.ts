/**
 * @description Creates a nested object with keys from an array and assigns the `value` to the last key
 * @param {array} path - array to be nested
 * @param {string} value - value to assign
 * @returns {object | null} nested object or null if no object was created
 */
export const objectFromPath = (path: string[], value?: unknown): object | null => {
  const obj = path.reduceRight((result, key) => ({ [key]: result }), value);
  if (typeof obj === 'object') return obj;
  return null;
};
