import type { MaybeNumber, OntimeEvent } from 'ontime-types';
import { OffsetMode } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

export function getExpectedStart(
  event: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'delay'>,
  state: {
    currentDay: number; // the current day from the rundown
    totalGap: number;
    isLinkedToLoaded: boolean;
    offset: number;
    mode: OffsetMode;
    actualStart: MaybeNumber;
    plannedStart: MaybeNumber;
  },
): number {
  const { timeStart, dayOffset, delay } = event;
  const { currentDay, totalGap, isLinkedToLoaded, offset, mode, actualStart, plannedStart } = state;

  //How many days from the currently running event to this one
  const relativeDayOffset = dayOffset - currentDay;

  const delayedStart = Math.max(0, timeStart + delay);

  //The normalised start time of this event relative to the currently running event
  const normalisedTimeStart = delayedStart + relativeDayOffset * dayInMs;

  let relativeStartOffset = 0;

  if (mode === OffsetMode.Relative) {
    relativeStartOffset = (actualStart ?? 0) + currentDay * dayInMs - (plannedStart ?? 0);
  }

  const scheduledStartTime = normalisedTimeStart + relativeStartOffset;

  const offsetStartTime = scheduledStartTime + offset;

  if (isLinkedToLoaded) {
    //if we are directly linked back to the loaded event we just follow the offset
    return offsetStartTime;
  }

  const gapsCanCompensateForOffset = totalGap > offset;
  if (gapsCanCompensateForOffset) {
    // if we are ahead of schedule or the gap can compensate for the amount we are behind then expect to start at the scheduled time
    return scheduledStartTime;
  }

  // otherwise consume as much of the offset as possible with the gap
  const offsetStartTimeBufferedByGaps = offsetStartTime - totalGap;
  return offsetStartTimeBufferedByGaps;
}

export function getExpectedEnd(
  event: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'duration' | 'countToEnd'>,
  expectedStart: number,
  currentRuntimeDay: number,
): number {
  /**
   * Count to end events are a special case
   * - the end time is always the wall clock
   */
  if (event.countToEnd) {
    // account for day offset
    const relativeDayOffset = event.dayOffset - currentRuntimeDay;
    const plannedEnd = event.timeStart + event.duration + relativeDayOffset * dayInMs;

    // count to end should finish on the planned time or on start
    return Math.max(expectedStart, plannedEnd);
  }

  // for normal events, the expected end is when we would start + its duration
  return expectedStart + event.duration;
}
