import { MaybeNumber } from 'ontime-types';

import { clamp } from './math';

/**
 * Returns completion percentage of a progress bar
 * This code assumes the current time and duration have addedTime already applied
 */
export function getProgress(current: MaybeNumber, duration: MaybeNumber) {
  if (current === null || duration === null) {
    return 0;
  }

  if (current <= 0) {
    return 100;
  }

  if (current >= duration) {
    return 0;
  }

  return clamp(((duration - current) / duration) * 100, 0, 100);
}
