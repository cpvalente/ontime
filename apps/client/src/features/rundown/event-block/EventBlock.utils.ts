import { millisToString, removeTrailingZero } from 'ontime-utils';

import { formatDuration } from '../../../common/utils/time';

export function formatDelay(timeStart: number, delay: number): string | undefined {
  if (!delay) return;

  const delayedStart = Math.max(0, timeStart + delay);

  const timeTag = removeTrailingZero(millisToString(delayedStart));
  return `New start ${timeTag}`;
}
export function formatOverlap(gap: number, isNextDay: boolean) {
  if (gap === 0) return;

  const gapString = formatDuration(Math.abs(gap), false);
  return `${gap < 0 ? 'Overlap' : 'Gap'} ${gapString}${isNextDay ? ' (next day)' : ''}`;
}
