import type { OntimeEvent } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * Utility returns the gap from a previous given event
 */
export function getTimeFrom(
  current: Pick<OntimeEvent, 'timeStart' | 'dayOffset'>,
  previous: Pick<OntimeEvent, 'timeStart' | 'duration' | 'dayOffset'> | null,
): number {
  // there is no previous event
  if (!previous) {
    return 0;
  }

  const normalisedCurrentStart = current.timeStart + current.dayOffset * dayInMs;
  const normalisedPreviousEnd = previous.timeStart + previous.duration + previous.dayOffset * dayInMs;

  /**
   * The distance between the current start and the previous end
   * - positive: there is a gap between the events
   * - zero: the current event starts on the previous end
   * - negative: the events overlap
   */
  return normalisedCurrentStart - normalisedPreviousEnd;
}
