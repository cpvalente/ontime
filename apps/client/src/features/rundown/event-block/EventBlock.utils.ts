import {
  calculateDuration,
  checkIsNextDay,
  dayInMs,
  getTimeFromPrevious,
  millisToString,
  removeTrailingZero,
} from 'ontime-utils';

import { formatDuration } from '../../../common/utils/time';

export function formatDelay(timeStart: number, delay: number): string | undefined {
  if (!delay) return;

  const delayedStart = Math.max(0, timeStart + delay);

  const timeTag = removeTrailingZero(millisToString(delayedStart));
  return `New start ${timeTag}`;
}

export function formatOverlap(timeStart: number, previousStart?: number, previousEnd?: number): string | undefined {
  const noPreviousElement = previousEnd === undefined || previousStart === undefined;
  if (noPreviousElement) return;

  const normalisedDuration = calculateDuration(previousStart, previousEnd);
  const timeFromPrevious = getTimeFromPrevious(timeStart, previousStart, previousEnd, normalisedDuration);
  if (timeFromPrevious === 0) return;

  if (checkIsNextDay(previousStart, timeStart, normalisedDuration)) {
    const previousCrossMidnight = previousStart > previousEnd;
    const normalisedPreviousEnd = previousCrossMidnight ? previousEnd + dayInMs : previousEnd;

    const gap = dayInMs - normalisedPreviousEnd + timeStart;
    if (gap === 0) return;
    const gapString = formatDuration(Math.abs(gap), false);
    return `Gap ${gapString} (next day)`;
  }

  const overlapString = formatDuration(Math.abs(timeFromPrevious), false);
  return `${timeFromPrevious < 0 ? 'Overlap' : 'Gap'} ${overlapString}`;
}
