import { MaybeNumber } from 'ontime-types';
import { dayInMs, millisToString, removeLeadingZero, removeTrailingZero } from 'ontime-utils';

export function formatDelay(timeStart: number, delay: number): string | undefined {
  if (!delay) return;

  const delayedStart = Math.max(0, timeStart + delay);

  const timeTag = removeTrailingZero(millisToString(delayedStart));
  return `New start ${timeTag}`;
}

/**
 * Utility function checks whether a given event is the day after from its predecessor
 * We consider an event to be the day after, if it begins before the start of the previous
 * @example day after
 * // 09:00 - 10:00
 * // 08:00 - 10:30 <--- day after
 * @example same day
 * // 09:00 - 10:00
 * // 09:30 - 10:30 <--- same day
 */
function checkIsNextDay(previousStart: number, timeStart: number): boolean {
  return timeStart < previousStart;
}

export function formatOverlap(
  previousStart: MaybeNumber,
  previousEnd: MaybeNumber,
  timeStart: number,
): string | undefined {
  const noPreviousElement = previousEnd === null || previousStart === null;
  if (noPreviousElement) return;

  const overlap = previousEnd - timeStart;
  if (overlap === 0) return;

  const previousCrossMidnight = previousStart > previousEnd;
  const isNextDay = previousCrossMidnight
    ? checkIsNextDay(previousEnd, timeStart) || previousEnd == 0 // exception for when previousEnd is precisely midnight
    : checkIsNextDay(previousStart, timeStart);

  const correctedPreviousEnd = previousCrossMidnight ? previousEnd + dayInMs : previousEnd;

  if (isNextDay) {
    const gap = dayInMs - correctedPreviousEnd + timeStart;
    if (gap === 0) return;
    const gapString = removeLeadingZero(millisToString(Math.abs(gap)));
    return `Gap ${gapString} (next day)`;
  }

  const overlapString = removeLeadingZero(millisToString(Math.abs(overlap)));
  return `${overlap > 0 ? 'Overlap' : 'Gap'} ${overlapString}`;
}
