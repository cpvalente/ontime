import type { OntimeEvent } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * Checks whether a new element is the latest in the list
 */
export function isNewLatest(
  currentEvent: Pick<OntimeEvent, 'timeStart' | 'duration' | 'dayOffset'>,
  previousEvent: Pick<OntimeEvent, 'timeStart' | 'duration' | 'dayOffset'> | null,
) {
  // true if there is no previous
  if (!previousEvent) {
    return true;
  }

  const normalisedCurrentEnd = currentEvent.timeStart + currentEvent.duration + currentEvent.dayOffset * dayInMs;
  const normalisedPreviousEnd = previousEvent.timeStart + previousEvent.duration + previousEvent.dayOffset * dayInMs;

  return normalisedCurrentEnd >= normalisedPreviousEnd;
}
