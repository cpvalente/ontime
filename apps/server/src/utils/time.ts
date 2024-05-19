import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';
import { isISO8601 } from '../../../../packages/utils/src/date-utils/isTimeString.js';

export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

/**
 * @description Converts a date object to milliseconds
 * @argument {Date} date
 * @returns {number} - time in milliseconds
 */

export const dateToMillis = (date: Date): number => {
  // TODO: Use UTC
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  return h * MILLIS_PER_HOUR + m * MILLIS_PER_MINUTE + s * MILLIS_PER_SECOND;
};

/**
 * @description safe parse string to int, copied from client code
 * @param valueAsString
 * @return {number}
 */
const parse = (valueAsString: string): number => {
  const parsed = parseInt(valueAsString, 10);
  if (isNaN(parsed)) {
    return 0;
  }
  return Math.abs(parsed);
};

const stripAMPM = (value: string) => {
  const lowerValue = value.toLowerCase();
  if (lowerValue.endsWith('am')) {
    return { sansPostfix: lowerValue.substring(0, lowerValue.length - 2), pastNoon: false };
  } else if (lowerValue.endsWith('pm')) {
    return { sansPostfix: lowerValue.substring(0, lowerValue.length - 2), pastNoon: true };
  } else {
    return { sansPostfix: lowerValue, pastNoon: false };
  }
};

/**
 * @description Parses a time string to millis, copied from client code
 * @param {string} value - time string
 * @returns {number} - time string in millis
 */
export const forgivingStringToMillis = (value: string): number => {
  let millis = 0;

  // check for AM/PM indicators
  const { sansPostfix, pastNoon } = stripAMPM(value);

  //if past noon indicated add 12 hours
  if (pastNoon) {
    millis = MILLIS_PER_HOUR * 12;
  }
  // split string at known separators    : , .
  const separatorRegex = /[\s,:.]+/;
  const [first, second, third] = sansPostfix.split(separatorRegex);

  if (first != null && second != null && third != null) {
    // if string has three sections, treat as [hours] [minutes] [seconds]
    millis += parse(first) * MILLIS_PER_HOUR;
    millis += parse(second) * MILLIS_PER_MINUTE;
    millis += parse(third) * MILLIS_PER_SECOND;
  } else if (first != null && second == null && third == null) {
    // if string has one section,
    // could be a complete string like 121010 - 12:10:10
    if (first.length === 6) {
      const hours = first.substring(0, 2);
      const minutes = first.substring(2, 4);
      const seconds = first.substring(4);
      millis += parse(hours) * MILLIS_PER_HOUR;
      millis += parse(minutes) * MILLIS_PER_MINUTE;
      millis += parse(seconds) * MILLIS_PER_SECOND;
    } else {
      // otherwise lets treat as [minutes]
      millis += parse(first) * MILLIS_PER_MINUTE;
    }
  }
  if (first != null && second != null && third == null) {
    // if string has two sections  treat as [hours] [minutes]
    millis += parse(first) * MILLIS_PER_HOUR;
    millis += parse(second) * MILLIS_PER_MINUTE;
  }
  return millis;
};

/**
 * @description Parses an excel date using the correct parser
 * @param {string} excelDate
 * @returns {number} - time in milliseconds
 */
export const parseExcelDate = (excelDate: unknown): number => {
  if (excelDate instanceof Date) {
    return dateToMillis(excelDate);
  }

  if (typeof excelDate === 'string') {
    if (isISO8601(excelDate)) {
      const date = new Date(excelDate);
      if (date instanceof Date && !isNaN(date.getTime())) {
        return dateToMillis(date);
      }
    }
    return forgivingStringToMillis(excelDate);
  }

  // if the user uses a number value eg. 15, excel could format the cell as number
  if (typeof excelDate === 'number') {
    return excelDate * MILLIS_PER_MINUTE;
  }

  return 0;
};
