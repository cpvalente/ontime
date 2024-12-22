import { MaybeNumber, PlayableEvent } from 'ontime-types';
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

export function calculateAccumulatedGap(
  accGap: MaybeNumber,
  currentEvent: PlayableEvent,
  previousEvent?: PlayableEvent,
): MaybeNumber {
  if (previousEvent === undefined) return null;

  const normalisedDuration = calculateDuration(previousEvent.timeStart, previousEvent.timeEnd);
  const timeFromPrevious = getTimeFromPrevious(
    currentEvent.timeStart,
    previousEvent.timeStart,
    previousEvent.timeEnd,
    normalisedDuration,
  );
  if (timeFromPrevious === 0 && accGap === null) return null;

  if (checkIsNextDay(previousEvent.timeStart, currentEvent.timeStart, normalisedDuration)) {
    const previousCrossMidnight = previousEvent.timeStart > previousEvent.timeEnd;
    const normalisedPreviousEnd = previousCrossMidnight ? previousEvent.timeEnd + dayInMs : previousEvent.timeEnd;

    const gap = dayInMs - normalisedPreviousEnd + currentEvent.timeStart;
    if (gap === 0 && accGap === null) return null;
    return gap + (accGap ?? 0);
  }
  return timeFromPrevious + (accGap ?? 0);
}
