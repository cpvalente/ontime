/**
 * @description Creates a nested object with keys from an array and assigns the `value` to the last key
 * @param {array} path - array to be nested
 * @param {string} value - value to assign
 * @returns {object | string | null} nested object or null if no object was created
 */
export const integrationPayloadFromPath = (path: string[], value?: unknown): object | string | null => {
  if (path.length == 1) {
    if (value === undefined) {
      return path[0];
    } else {
      return { [path[0]]: value };
    }
  }
  if (value === undefined) {
    value = path.pop();
  }
  const obj = path.reduceRight((result, key) => ({ [key]: result }), value);
  if (typeof obj === 'object') return obj;
  return null;
};
