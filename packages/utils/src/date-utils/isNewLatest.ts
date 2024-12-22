import { dayInMs } from './conversionUtils.js';

/**
 * Checks whether a new element is the latest in the list
 */
export function isNewLatest(
  timeStart: number,
  duration: number,
  dayOffset: number = 0,
  previousStart?: number,
  previousDuration?: number,
  previousDayOffset?: number,
): boolean {
  // true if there is no previous
  if (previousStart === undefined || previousDuration === undefined || previousDayOffset === undefined) {
    return true;
  }

  const timeStartDayAdjust = timeStart + dayOffset * dayInMs;
  const timeEnd = timeStart + duration;
  const previousEnd = previousStart + previousDuration + previousDayOffset * dayInMs;

  // true if it starts after the previous is finished
  if (timeStartDayAdjust >= previousEnd) {
    return true;
  }

  // true if it finishes later than previous
  if (timeEnd > previousEnd) {
    return true;
  }

  return false;
}
