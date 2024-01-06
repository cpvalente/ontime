import { DateTime } from 'luxon';

// TODO: collocate functions
/**
 * @description utility function to format a date in milliseconds using luxon
 * @param {number} millis
 * @param {string} format
 * @return {string}
 */
export function formatFromMillis(millis: number, format: string): string {
  return DateTime.fromMillis(millis).toUTC().toFormat(format);
}
