import { checkIsNextDay } from './checkIsNextDay.js';
import { dayInMs } from './conversionUtils.js';

/**
 * Utility returns the time elapsed (gap or overlap) from the previous
 * It uses deconstructed parameters to simplify implementation in UI
 */
export function getTimeFromPrevious(
  currentStart: number,
  previousStart?: number,
  previousEnd?: number,
  previousDuration?: number,
): number {
  // there is no previous event
  if (previousStart === undefined || previousEnd === undefined || previousDuration === undefined) {
    return 0;
  }

  // event is linked to previous
  if (currentStart === previousEnd) {
    return 0;
  }

  // event is the day after
  if (checkIsNextDay(previousStart, currentStart, previousDuration)) {
    // time from previous is difference between normalised start and previous end
    return currentStart + dayInMs - previousEnd;
  }

  // event has a gap from previous
  if (currentStart > previousEnd) {
    // time from previous is difference between start and previous end
    return currentStart - previousEnd;
  }

  // event overlaps with previous
  const overlap = previousEnd - currentStart;
  if (overlap > 0) {
    // time is a negative number indicating the amount of overlap
    return -overlap;
  }

  // we need to make sure we return a number, but there are no business cases for this
  return 0;
}
