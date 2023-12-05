import { cssColours } from 'ontime-types';
import { isColourHex } from 'ontime-utils';

/**
 * @description Converts a value to a string if possible, throws otherwise
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
 * @description Converts a value to a boolean if possible, throws otherwise
 * @param {unknown} value - Value to be converted to a boolean.
 * @returns {boolean} - The converted value as a boolean.
 * @throws {Error} Throws an error if the value is null or undefined.
 */
export function coerceBoolean(value: unknown): boolean {
  if (value == null) {
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
  if (value == null || typeof value != 'string') {
    throw new Error('Invalid colour value received');
  }
  if (value[0] == '#') {
    const isHexColor = isColourHex(value);
    if (isHexColor) {
      return value;
    } else {
      throw new Error('Invalid hex colour received');
    }
  } else {
    const lowerCaseValue = value.toLocaleLowerCase();
    const isCssColor = lowerCaseValue in cssColours;
    if (isCssColor) {
      return lowerCaseValue;
    } else {
      throw new Error('Invalid colour name received');
    }
  }
  //TODO: do we want to change other types to colors?
}
