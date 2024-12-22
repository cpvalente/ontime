import type { MaybeNumber } from 'ontime-types';
import { millisToString, removeTrailingZero } from 'ontime-utils';

import { formatDuration } from '../../../common/utils/time';

export function formatDelay(timeStart: number, delay: number): string | undefined {
  if (!delay) return;

  const delayedStart = Math.max(0, timeStart + delay);

  const timeTag = removeTrailingZero(millisToString(delayedStart));
  return `New start ${timeTag}`;
}

/**
 * Creates a string representation of the overlap or gap between two events.
 * @example formatOverlap(1000, false) => "Gap 1s"
 * @example formatOverlap(-1000, false) => "Overlap 1s"
 * @example formatOverlap(1000, true) => "Gap 1s (next day)"
 */
export function formatGap(gap: MaybeNumber, isNextDay: boolean): string | undefined {
  // we only care if gap has a value non-zero and non-nullish
  if (!gap) return;

  const gapString = formatDuration(Math.abs(gap), false);
  return `${gap < 0 ? 'Overlap' : 'Gap'} ${gapString}${isNextDay ? ' (next day)' : ''}`;
}
