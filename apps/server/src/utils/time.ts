import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND, parseUserTime } from 'ontime-utils';
import { isISO8601 } from '../../../../packages/utils/src/date-utils/isTimeString.js';

export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

/**
 * @description Converts a date object to milliseconds
 * @argument {Date} date
 * @returns {number} - time in milliseconds
 */

export function dateToMillis(date: Date): number {
  // TODO: Use UTC
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  return h * MILLIS_PER_HOUR + m * MILLIS_PER_MINUTE + s * MILLIS_PER_SECOND;
}

/**
 * @description Parses an excel date using the correct parser
 * @param {string} excelDate
 * @returns {number} - time in milliseconds
 */
export function parseExcelDate(excelDate: unknown): number {
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
    return parseUserTime(excelDate);
  }

  // if the user uses a number value eg. 15, excel could format the cell as number
  if (typeof excelDate === 'number') {
    return excelDate * MILLIS_PER_MINUTE;
  }

  return 0;
}
