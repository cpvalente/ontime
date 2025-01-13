import type { OntimeEvent } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * Utility returns the gap from previous event
 */
export function getTimeFromPrevious(
  current: Pick<OntimeEvent, 'timeStart' | 'dayOffset'>,
  previous?: Pick<OntimeEvent, 'timeStart' | 'duration' | 'dayOffset'>,
): number {
  // there is no previous event
  if (!previous) {
    return 0;
  }

  const normalisedCurrentStart = current.timeStart + current.dayOffset * dayInMs;
  const normalisedPreviousEnd = previous.timeStart + previous.duration + previous.dayOffset * dayInMs;

  // event is linked to previous
  if (normalisedCurrentStart === normalisedPreviousEnd) {
    return 0;
  }

  // event has a gap from previous
  if (normalisedCurrentStart > normalisedPreviousEnd) {
    // time from previous is difference between start and previous end
    return normalisedCurrentStart - normalisedPreviousEnd;
  }

  // event overlaps with previous
  return normalisedCurrentStart - normalisedPreviousEnd;
}
