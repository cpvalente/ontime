import type { OntimeEvent } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * Utility function checks whether a given event is the day after from its predecessor
 */
export function checkIsNextDay(
  current: Pick<OntimeEvent, 'timeStart' | 'dayOffset'>,
  previous?: Pick<OntimeEvent, 'timeStart' | 'duration' | 'dayOffset'>,
): boolean {
  if (!previous) {
    return false;
  }

  // if the day offsets are the same it can't be the next day
  if (current.dayOffset <= previous.dayOffset) {
    return false;
  }

  // if the previous event crossed midnight then the current is the same day
  if (previous.timeStart + previous.duration > dayInMs) {
    return false;
  }

  return true;
}
