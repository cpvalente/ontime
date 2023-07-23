import { formatFromMillis } from 'ontime-utils';

import { mth, mtm, mts } from './timeConstants';

export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

export function secondsInMillis(millis: number | null) {
  if (!millis) {
    return 0;
  }
  return Math.floor((millis % mtm) / mts);
}

/**
 * @description Converts milliseconds to seconds
 * @param {number | null} millis - time in seconds
 * @returns {number} Amount in seconds
 */
export const millisToSeconds = (millis: number | null): number => {
  if (millis === null) {
    return 0;
  }
  return millis < 0 ? Math.ceil(millis / mts) : Math.floor(millis / mts);
};

/**
 * @description Converts milliseconds to seconds
 * @param {number} millis - time in milliseconds
 * @returns {number} Amount in seconds
 */
export const millisToMinutes = (millis: number): number => {
  return millis < 0 ? Math.ceil(millis / mtm) : Math.floor(millis / mtm);
};

/**
 * @description safe parse string to int
 * @param {string} valueAsString
 * @return {number}
 */
const parse = (valueAsString: string): number => {
  const parsed = parseInt(valueAsString, 10);
  if (isNaN(parsed)) {
    return 0;
  }
  return Math.abs(parsed);
};

/**
 * @description Utility function to check if a string contain am/pm indicators
 * @param {string} value
 */
function checkAmPm(value: string) {
  let isPM = false;
  let isAM = false;
  if (value.toLowerCase().includes('pm')) {
    isPM = true;
    value = value.replace(/pm/i, '');
  } else if (value.toLowerCase().includes('p')) {
    isPM = true;
    value = value.replace(/p/i, '');
  }

  // we need to remove am, but it doesn't actually change anything
  if (value.toLowerCase().includes('am')) {
    isAM = true;
    value = value.replace(/am/i, '');
  } else if (value.toLowerCase().includes('a')) {
    isAM = true;
    value = value.replace(/a/i, '');
  }

  return { isAM, isPM, value };
}

/**
 * @description Utility function to check if a string contain h / m / s indicators
 * @param {string} value
 */
function checkMatchers(value: string) {
  const hoursMatch = /(\d+)h/.exec(value);
  const hoursMatchValue = hoursMatch ? parse(hoursMatch[1]) : 0;

  const minutesMatch = /(\d+)m/.exec(value);
  const minutesMatchValue = minutesMatch ? parse(minutesMatch[1]) : 0;

  const secondsMatch = /(\d+)s/.exec(value);
  const secondsMatchValue = secondsMatch ? parse(secondsMatch[1]) : 0;

  if (hoursMatchValue > 0 || minutesMatchValue > 0 || secondsMatchValue > 0) {
    return hoursMatchValue * mth + minutesMatchValue * mtm + secondsMatchValue * mts;
  }
  return { hoursMatchValue };
}

/**
 * @description Utility function to infer separators from a whole string
 * @param {string} value
 * @param {boolean} isAM
 * @param {boolean} isPM
 */
function inferSeparators(value: string, isAM: boolean, isPM: boolean) {
  const length = value.length;
  let inferredMillis = 0;
  let addAM = 0;
  if (length === 1) {
    if (isPM || isAM) {
      inferredMillis = parse(value) * mth;
      if (isAM) {
        // this ensures we dont add 12 hours in the end
        addAM = inferredMillis;
      }
    } else {
      inferredMillis = parse(value) * mtm;
    }
  } else if (length === 2) {
    if (isPM || isAM) {
      inferredMillis = parse(value) * inferredMillis;
      if (isAM) {
        // this ensures we dont add 12 hours in the end
        addAM = 12;
      }
    } else {
      inferredMillis = parse(value) * mtm;
    }
  } else if (length === 3) {
    inferredMillis = parse(value[0]) * mth + parse(value.substring(1)) * mtm;
  } else if (length === 4) {
    inferredMillis = parse(value.substring(0, 2)) * mth + parse(value.substring(2)) * mtm;
  } else if (length === 5) {
    const hours = parse(value.substring(0, 2));
    const minutes = parse(value.substring(2, 4));
    const seconds = parse(value.substring(4));
    inferredMillis = hours * mth + minutes * mtm + seconds * mts;
  } else if (length >= 6) {
    const hours = parse(value.substring(0, 2));
    const minutes = parse(value.substring(2, 4));
    const seconds = parse(value.substring(4));
    inferredMillis = hours * mth + minutes * mtm + seconds * mts;
  }
  return { inferredMillis, addAM };
}

/**
 * @description Parses a time string to millis, auto-filling to the left
 * @param {string} value - time string
 * @returns {number} - time string in millis
 */
export const forgivingStringToMillis = (value: string): number => {
  if (value === '12am') {
    return 0;
  }

  const { isAM, isPM, value: parsingValue } = checkAmPm(value);
  const maybeMillisFromMatchers = checkMatchers(parsingValue);
  if (typeof maybeMillisFromMatchers === 'number') {
    return maybeMillisFromMatchers;
  }

  let { hoursMatchValue } = maybeMillisFromMatchers;

  let millis = 0;

  // split string at known separators    : , .
  const separatorRegex = /[\s,:.]+/;
  const [first, second, third] = parsingValue.split(separatorRegex);

  if (first != null && second != null && third != null) {
    // if string has three sections, treat as [hours] [minutes] [seconds]
    millis = parse(first) * mth;
    millis += parse(second) * mtm;
    millis += parse(third) * mts;
  } else if (first != null && second == null && third == null) {
    // we only have one section, infer separators
    const { inferredMillis, addAM } = inferSeparators(first, isAM, isPM);
    millis = inferredMillis;
    hoursMatchValue = addAM;
  }
  if (first != null && second != null && third == null) {
    millis = parse(first) * mth;
    millis += parse(second) * mtm;
  }

  // Add 12 hours if it is PM
  if (isPM && hoursMatchValue < 12) {
    millis += 12 * mth;
  }
  return millis;
};

export function millisToDelayString(millis: number | null): undefined | string | null {
  if (millis == null || millis === 0) {
    return null;
  }

  const isNegative = millis < 0;
  const absMillis = Math.abs(millis);

  if (absMillis < mtm) {
    return `${isNegative ? '-' : '+'}${formatFromMillis(absMillis, 's')} sec`;
  } else if (absMillis < mth && absMillis % mtm === 0) {
    return `${isNegative ? '-' : '+'}${formatFromMillis(absMillis, 'm')} min`;
  } else {
    return `${isNegative ? '-' : '+'}${formatFromMillis(absMillis, 'HH:mm:ss')}`;
  }
}
