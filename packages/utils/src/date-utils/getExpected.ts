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
    // account for day offset
    const relativeDayOffset = event.dayOffset - state.currentDay;
    const plannedEnd = event.timeStart + event.duration + relativeDayOffset * dayInMs;

    // count to end cant finish later than the plan
    return Math.max(expectedStart, plannedEnd);
  }

  // for normal events, the expected end is when we would start + its duration
  return expectedStart + event.duration;
}
