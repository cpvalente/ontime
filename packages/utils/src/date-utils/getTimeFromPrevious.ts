import type { OntimeEvent } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * Utility returns the time elapsed (gap or overlap) from the previous
 * It uses deconstructed parameters to simplify implementation in UI
 */
export function getTimeFromPrevious(
  current: Pick<OntimeEvent, 'timeStart' | 'dayOffset'>,
  previous?: Pick<OntimeEvent, 'timeStart' | 'duration' | 'dayOffset'> | null,
): number {
  // there is no previous event
  if (!previous) {
    return 0;
  }

  const currentStartDayAdjusted = current.timeStart + current.dayOffset * dayInMs;
  const previousEndDayAdjusted = previous.timeStart + previous.duration + previous.dayOffset * dayInMs;

  // event is linked to previous
  if (currentStartDayAdjusted === previousEndDayAdjusted) {
    return 0;
  }

  // event has a gap from previous
  if (currentStartDayAdjusted > previousEndDayAdjusted) {
    // time from previous is difference between start and previous end
    return currentStartDayAdjusted - previousEndDayAdjusted;
  }

  // event overlaps with previous
  return currentStartDayAdjusted - previousEndDayAdjusted;
}
