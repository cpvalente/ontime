import { MaybeNumber } from 'ontime-types';
import { checkIsNextDay, dayInMs, millisToString, removeLeadingZero, removeTrailingZero } from 'ontime-utils';

export function formatDelay(timeStart: number, delay: number): string | undefined {
  if (!delay) return;

  const delayedStart = Math.max(0, timeStart + delay);

  const timeTag = removeTrailingZero(millisToString(delayedStart));
  return `New start ${timeTag}`;
}

export function formatOverlap(
  previousStart: MaybeNumber,
  previousEnd: MaybeNumber,
  timeStart: number,
): string | undefined {
  const noPreviousElement = previousEnd === null || previousStart === null;
  if (noPreviousElement) return;

  const timeFromPrevious = previousEnd - timeStart;
  if (timeFromPrevious === 0) return;

  const previousCrossMidnight = previousStart > previousEnd;
  const isNextDay = previousCrossMidnight
    ? previousEnd === 0 || checkIsNextDay(previousEnd, timeStart, previousEnd - previousStart) // exception for when previousEnd is precisely midnight
    : checkIsNextDay(previousStart, timeStart, previousEnd - previousStart);
  const correctedPreviousEnd = previousCrossMidnight ? previousEnd + dayInMs : previousEnd;

  if (isNextDay) {
    const gap = dayInMs - correctedPreviousEnd + timeStart;
    if (gap === 0) return;
    const gapString = removeLeadingZero(millisToString(Math.abs(gap)));
    return `Gap ${gapString} (next day)`;
  }

  const overlapString = removeLeadingZero(millisToString(Math.abs(timeFromPrevious)));
  return `${timeFromPrevious > 0 ? 'Overlap' : 'Gap'} ${overlapString}`;
}
