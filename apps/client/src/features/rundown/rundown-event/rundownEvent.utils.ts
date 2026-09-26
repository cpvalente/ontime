import type { Maybe, OntimeGroup } from 'ontime-types';
import { millisToString, removeTrailingZero } from 'ontime-utils';

import { formatDuration, normaliseWallClock } from '../../../common/utils/time';

export function formatDelay(timeStart: number, delay: number): string | undefined {
  if (!delay) return;

  const delayedStart = normaliseWallClock(timeStart + delay);

  const timeTag = removeTrailingZero(millisToString(delayedStart));
  return `New start ${timeTag}`;
}

export function formatGap(gap: number, isNextDay: boolean) {
  if (gap === 0) {
    if (isNextDay) {
      // We show a next day warning even if there is no gap
      return '(next day)';
    }
    return;
  }

  const gapString = formatDuration(Math.abs(gap), false);
  return `${gap < 0 ? 'Overlap' : 'Gap'} ${gapString}${isNextDay ? ' (next day)' : ''}`;
}

export type GroupDurationFit = 'increase' | 'decrease' | null;

/**
 * How an event should change for its group to meet the group target duration
 */
export function getGroupDurationFit(group: Maybe<OntimeGroup>): GroupDurationFit {
  if (!group || group.targetDuration === null || group.duration === group.targetDuration) return null;
  return group.targetDuration > group.duration ? 'increase' : 'decrease';
}
