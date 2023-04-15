import { DateTime } from 'luxon';

/**
 * @description utility function to format a date in milliseconds using luxon
 * @param {number} millis
 * @param {string} format
 * @return {string}
 */
export function formatFromMillis(millis: number, format: string) {
  return DateTime.fromMillis(millis).toUTC().toFormat(format);
}
