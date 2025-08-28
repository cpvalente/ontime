import { CssColours, isColourHex } from 'ontime-utils';

/**
 * @description Converts a value to an item in the provided enume.
 * @param {unknown} value - Value to be converted.
 * @returns {T} - The converted value as key of the enum.
 * @throws {Error} Throws an error value is not found in the enum.
 */
export function coerceEnum<T>(value: unknown, list: object): T {
  if (typeof value !== 'string' || !Object.values(list).includes(value)) {
    throw new Error('Invalid value received');
  }
  return value as T;
}

/**
 * @description Converts a value to a string if possible, throws otherwise
 * @param {unknown} value - Value to be converted to a string.
 * @returns {string} - The converted value as a string.
 * @throws {Error} Throws an error if the value is null or undefined.
 */
export function coerceString(value: unknown): string {
  if (value == null || typeof value === 'object') {
    throw new Error('Invalid value received');
  }
  return String(value);
}

/**
 * @description Converts a value to a boolean if possible, throws otherwise
 * @param {unknown} value - Value to be converted to a boolean.
 * @returns {boolean} - The converted value as a boolean.
 * @throws {Error} Throws an error if the value is null or undefined.
 */
export function coerceBoolean(value: unknown): boolean {
  if (value === undefined || typeof value === 'object') {
    throw new Error('Invalid value received');
  }
  if (typeof value === 'string') {
    const lowerCaseValue = value.toLocaleLowerCase();
    switch (lowerCaseValue) {
      case 'true':
      case '1':
      case 'yes':
        return true;
      case 'false':
      case '0':
      case 'no':
      case '':
        return false;
      default:
        throw new Error('Invalid value received');
    }
  }
  return Boolean(value);
}

/**
 * @description Converts a value to a number if possible, throws otherwise
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

/**
 * @description Converts a value to a colour if possible, throws otherwise
 * @param {unknown} value - Value to be converted to a colour.
 * @returns {string} - The converted value as a string.
 * @throws {Error} Throws an error if the value is null or undefined.
 */
export function coerceColour(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Invalid colour value received');
  }
  const lowerCaseValue = value.toLocaleLowerCase();
  if (lowerCaseValue.startsWith('#')) {
    if (!isColourHex(lowerCaseValue)) {
      throw new Error('Invalid hex colour received');
    }
    return lowerCaseValue;
  }
  if (lowerCaseValue === '') {
    return lowerCaseValue; // None colour the same as the UI 'Ø' button
  }
  if (!(lowerCaseValue in CssColours)) {
    throw new Error('Invalid colour name received');
  }
  return lowerCaseValue;
}
