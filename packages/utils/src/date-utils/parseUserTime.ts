import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from './conversionUtils.js';

/**
 * @description Parses a user given time string to a value in milliseconds
 * @param {string} value - time string
 * @returns {number} - value in milliseconds
 */
export function parseUserTime(value: string): number {
  const { isAM, isPM, value: parsingValue } = checkAmPm(value.toLowerCase());
  const maybeMillisFromMatchers = checkMatchers(parsingValue);
  if (maybeMillisFromMatchers !== null) {
    return maybeMillisFromMatchers;
  }

  // split string at known separators    : , .
  const separatorRegex = /[\s,:.]+/;
  const [first, second, third] = parsingValue.split(separatorRegex);

  let millis = 0;
  let addTwelve = isPM;

  if (first != null && second != null && third != null) {
    // if string has three sections, treat as [hours] [minutes] [seconds]
    let hours = parse(first);
    if (hours === 12) {
      if (isAM) {
        hours = 0;
      }
      addTwelve = false;
    }
    millis = hours * MILLIS_PER_HOUR;
    millis += parse(second) * MILLIS_PER_MINUTE;
    millis += parse(third) * MILLIS_PER_SECOND;
  } else if (first != null && second == null && third == null) {
    // we only have one section, infer separators
    const { inferredMillis, addAM } = inferSeparators(first, isAM, isPM);
    millis = inferredMillis;
    addTwelve = addAM < 12 && isPM;
  } else if (first != null && second != null && third == null) {
    // if string has two sections, treat as [hours] [minutes]
    let hours = parse(first);
    if (hours === 12) {
      if (isAM) {
        hours = 0;
      }
      addTwelve = false;
    }
    millis = hours * MILLIS_PER_HOUR;
    millis += parse(second) * MILLIS_PER_MINUTE;
  }

  if (addTwelve) {
    millis += 12 * MILLIS_PER_HOUR;
  }

  return millis;
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
      inferredMillis = parse(value) * MILLIS_PER_HOUR;
      if (isAM) {
        // this ensures we dont add 12 hours in the end
        addAM = inferredMillis;
      }
    } else {
      inferredMillis = parse(value) * MILLIS_PER_MINUTE;
    }
  } else if (length === 2) {
    if (isPM || isAM) {
      if (value === '12' && isAM) {
        inferredMillis = 0;
      } else {
        inferredMillis = parse(value) * MILLIS_PER_HOUR;
      }

      if (isAM || value === '12') {
        // this ensures we dont add 12 hours in the end
        addAM = 12;
      }
    } else {
      inferredMillis = parse(value) * MILLIS_PER_MINUTE;
    }
  } else if (length === 3) {
    inferredMillis = parse(value[0]) * MILLIS_PER_HOUR + parse(value.substring(1)) * MILLIS_PER_MINUTE;
  } else if (length === 4) {
    inferredMillis = parse(value.substring(0, 2)) * MILLIS_PER_HOUR + parse(value.substring(2)) * MILLIS_PER_MINUTE;
  } else if (length >= 5) {
    const hours = parse(value.substring(0, 2));
    const minutes = parse(value.substring(2, 4));
    const seconds = parse(value.substring(4));
    inferredMillis = hours * MILLIS_PER_HOUR + minutes * MILLIS_PER_MINUTE + seconds * MILLIS_PER_SECOND;
  }
  return { inferredMillis, addAM };
}

/**
 * @description Utility function to check if a string contain h / m / s indicators
 * @param {string} value
 */
function checkMatchers(value: string): number | null {
  const hoursMatch = /(\d+)h/i.exec(value);
  const hoursMatchValue = hoursMatch ? parse(hoursMatch[1]) : 0;

  const minutesMatch = /(\d+)m/i.exec(value);
  const minutesMatchValue = minutesMatch ? parse(minutesMatch[1]) : 0;

  const secondsMatch = /(\d+)s/i.exec(value);
  const secondsMatchValue = secondsMatch ? parse(secondsMatch[1]) : 0;

  if (hoursMatchValue > 0 || minutesMatchValue > 0 || secondsMatchValue > 0) {
    return (
      hoursMatchValue * MILLIS_PER_HOUR + minutesMatchValue * MILLIS_PER_MINUTE + secondsMatchValue * MILLIS_PER_SECOND
    );
  }
  return null;
}

/**
 * @description Utility function to check if a string contain am/pm indicators
 * @description expects the value to be lowercased
 * @param {string} value
 * @returns {Object}
 * @returns {boolean} result.isAM - Whether we parsed an AM indicator
 * @returns {boolean} result.isPM - Whether we parsed a PM indicator
 * @returns {string} result.value - The original string with AM/PM indicator removed
 */
function checkAmPm(value: string): { isAM: boolean; isPM: boolean; value: string } {
  if (value.endsWith('pm')) {
    return { isAM: false, isPM: true, value: value.slice(0, -2) };
  }

  if (value.endsWith('p')) {
    return { isAM: false, isPM: true, value: value.slice(0, -1) };
  }

  if (value.endsWith('am')) {
    return { isAM: true, isPM: false, value: value.slice(0, -2) };
  }

  if (value.endsWith('a')) {
    return { isAM: true, isPM: false, value: value.slice(0, -1) };
  }

  return { isAM: false, isPM: false, value };
}

/**
 * @description safe parse string to int
 * @param {string} valueAsString
 * @return {number}
 */
function parse(valueAsString: string): number {
  const parsed = Number(valueAsString);
  if (isNaN(parsed)) {
    return 0;
  }
  return Math.abs(parsed);
}
