/**
 * @description Creates a nested object with keys from an array and assigns the `value` to the last key
 * @param {array} path - array to be nested
 * @param {string} value - value to assign
 * @returns {object | string | null} nested object or null if no object was created
 */
export const integrationPayloadFromPath = (path: string[], value?: unknown): object | string | null => {
  if (path.length === 1) {
    const key = path[0];
    return value === undefined ? key : { [key]: value };
  }

  const parsedValue = value === undefined ? path.at(-1) : value;
  const shortenedPath = value === undefined ? path.slice(0, -1) : path;

  const obj = shortenedPath.reduceRight((result, key) => ({ [key]: result }), parsedValue);

  return typeof obj === 'object' ? obj : null;
};
