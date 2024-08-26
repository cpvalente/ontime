import { checkIsNextDay } from './checkIsNextDay';
import { checkOverlap } from './checkOverlap';
import { dayInMs } from './conversionUtils';

/**
 * Utility returns the time elapsed (gap or overlap) from the previous
 * It uses deconstructed parameters to simplify implementation in UI
 */
export function getTimeFromPrevious(
  currentStart: number,
  currentEnd: number,
  previousStart?: number,
  previousEnd?: number,
  previousDuration?: number,
): number {
  // there is no previous event
  if (previousStart == null || previousEnd == null || previousDuration == null) {
    return 0;
  }

  // event is linked to previous
  if (currentStart === previousEnd) {
    return 0;
  }

  // event is the day after
  if (checkIsNextDay(previousStart, currentStart, previousDuration)) {
    // duration is difference between normalised start and previous end
    return currentStart + dayInMs - previousEnd;
  }

  // event has a gap from previous
  if (currentStart > previousEnd) {
    return currentStart - previousEnd;
  }

  // event overlaps with previous
  if (checkOverlap(previousStart, previousEnd, currentStart, currentEnd)) {
    // duration is the amount of time the current event has over the previous
    // this value must be capped at 0
    return Math.max(currentEnd - previousEnd, 0);
  }

  // we need to make sure we return a number, but there are no business cases for this
  return 0;
}
