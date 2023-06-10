import { DateTime } from 'luxon';

/**
 * @description Converts milliseconds to string representing time
 * @param {number | null} millis - time in milliseconds
 * @param {boolean} showSeconds - weather to show the seconds
 * @param {string} fallback - what to return if value is null
 * @returns {string} String representing time 00:12:02
 */
export function millisToString(millis: number | null, showSeconds = true, fallback = '...') {
  if (millis == null) {
    return fallback;
  }

  const isNegative = millis < 0;

  const format = `HH:mm${showSeconds ? ':ss' : ''}`;
  return `${isNegative ? '-' : ''}${DateTime.fromMillis(Math.abs(millis)).toUTC().toFormat(format)}`;
}
