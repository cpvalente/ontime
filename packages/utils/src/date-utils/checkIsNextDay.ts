import { dayInMs } from './conversionUtils.js';

/**
 * Utility function checks whether a given event is the day after from its predecessor
 * We consider an event to be the day after, if it begins before the start of the previous
 * @example day after
 * 09:00 - 10:00
 * 08:00 - 10:30
 * @example day after
 * 23:00 - 00:00
 * 02:00 - 03:00
 * @example same day
 * 09:00 - 10:00
 * 09:30 - 10:30
 * @example same day, but previous crosses midnight
 * 23:00 - 01:00
 * 02:00 - 03:00
 * @example same day, but previous crosses midnight (with overlap)
 * 22:00 - 02:00
 * 01:00 - 03:00
 */
export function checkIsNextDay(previousStart: number, timeStart: number, previousDuration: number): boolean {
  if (previousDuration === 0) {
    return false;
  }

  if (timeStart <= previousStart) {
    const normalisedPreviousEnd = previousStart + previousDuration;
    if (normalisedPreviousEnd === dayInMs) {
      return true;
    }
    // handle exception for an event that finishes exactly at midnight
    if (normalisedPreviousEnd > dayInMs) {
      return false;
    }
    return true;
  }

  return false;
}
