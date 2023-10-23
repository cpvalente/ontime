/**
 * @description Converts an unknown value to a string, if it's not null or undefined. Throws an error otherwise.
 * @param {unknown} value - Value to be converted to a string.
 * @returns {string} - The converted value as a string.
 * @throws {Error} Throws an error if the value is null or undefined.
 */
export function coerceString(value: unknown): string {
  if (value == null) {
    throw new Error('Invalid value received');
  }
  return String(value);
}

/**
 * @description Converts an unknown value to a boolean, if it's not null or undefined. Throws an error otherwise.
 * @param {unknown} value - Value to be converted to a boolean.
 * @returns {boolean} - The converted value as a boolean.
 * @throws {Error} Throws an error if the value is null or undefined.
 */
export function coerceBoolean(value: unknown): boolean {
  if (value == null) {
    throw new Error('Invalid value received');
  }
  return Boolean(value);
}

/**
 * @description Converts an unknown value to a number, if it's not null or undefined. Parses the value and checks if it's a valid number. Throws an error otherwise.
 * @param {unknown} value - Value to be converted to a number.
 * @returns {number} - The converted value as a number.
 * @throws {Error} Throws an error if the value is null, undefined or not a valid number.
 */
export function coerceNumber(value: unknown): number {
  if (value == null) {
    throw new Error('Invalid value received');
  }
  const parsedValue = Number(value);
  if (isNaN(parsedValue)) {
    throw new Error('Invalid value received');
  }
  return parsedValue;
}
