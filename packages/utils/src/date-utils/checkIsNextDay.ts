import type { OntimeEvent } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * Utility function checks whether a given event is the day after from its predecessor
 * We consider an event to be the day after, if it begins on a new day
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
export function checkIsNextDay(
  current: Pick<OntimeEvent, 'timeStart' | 'dayOffset'>,
  previous?: Pick<OntimeEvent, 'timeStart' | 'duration' | 'dayOffset'> | null,
): boolean {
  if (!previous) {
    return false;
  }

  // if the day offsets are the samme it can't be the next day
  if (current.dayOffset <= previous.dayOffset) {
    return false;
  }

  // if the previous event crossed midnight then the current is the same day as that
  if (previous.timeStart + previous.duration > dayInMs) {
    return false;
  }

  return true;
}
