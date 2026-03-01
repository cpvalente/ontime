import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND, isISO8601, pad, parseUserTime } from 'ontime-utils';

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

export function getTimezoneLabel(date: Date): string {
  const tz = date.getTimezoneOffset();
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // timezone offset is inverted
  const sign = tz < 0 ? '+' : '-';
  const abs = Math.abs(tz);

  // convert minutes to hours
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  return `GMT ${sign}${pad(hours)}:${pad(minutes)} ${tzName}`;
}

/**
 * Get current time from system
 */
export function timeNow() {
  const now = new Date();

  // extract milliseconds since midnight
  let elapsed = now.getHours() * 3600000;
  elapsed += now.getMinutes() * 60000;
  elapsed += now.getSeconds() * 1000;
  elapsed += now.getMilliseconds();
  return elapsed;
}
