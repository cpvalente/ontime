import type { MaybeNumber, OntimeEvent } from 'ontime-types';
import { OffsetMode } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * Runtime context shared by the expected start/end calculations
 */
type ExpectedTimesState = {
  currentDay: number; // the current day from the rundown
  totalGap: number; // accumulated gap from the current event
  isLinkedToLoaded: boolean; // is this event part of a chain linking back to the loaded event
  offset: number;
  mode: OffsetMode;
  actualStart: MaybeNumber;
  plannedStart: MaybeNumber;
};

export function getExpectedStart(
  event: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'delay'>,
  state: ExpectedTimesState,
): number {
  const { timeStart, dayOffset, delay } = event;
  const { currentDay, totalGap, isLinkedToLoaded, offset, mode, actualStart, plannedStart } = state;

  const absoluteDelayedStart = Math.max(0, dayOffset * dayInMs + timeStart + delay);
  const normalisedTimeStart = absoluteDelayedStart - currentDay * dayInMs;

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
  event: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'delay' | 'duration' | 'countToEnd'>,
  state: ExpectedTimesState,
): number {
  // expected start includes the delay and any offset compensation
  const expectedStart = getExpectedStart(event, state);

  /**
   * Count to end events are a special case
   * - the end time is always the wall clock
   */
  if (event.countToEnd) {
    const plannedEnd = event.dayOffset * dayInMs + event.timeStart + event.duration - state.currentDay * dayInMs;

    // count to end should finish on the planned time or on start
    return Math.max(expectedStart, plannedEnd);
  }

  // for normal events, the expected end is when we would start + its duration
  return expectedStart + event.duration;
}
