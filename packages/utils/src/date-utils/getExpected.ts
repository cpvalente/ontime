import type { Duration, Offset, OntimeEvent } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * Delays are an announced change to the plan, see docs/agent-guides/domain-invariants.md#delays
 * The delayed times are the ones the crew was told, and the runtime offset is measured from them
 */
export function getDelayedStart(event: Pick<OntimeEvent, 'timeStart' | 'delay'>): number {
  return Math.max(0, event.timeStart + event.delay);
}

/** A delay moves the end of an event, but never the deadline of a count to end event */
export function getDelayedEnd(event: Pick<OntimeEvent, 'timeEnd' | 'delay' | 'countToEnd'>): number {
  return event.countToEnd ? event.timeEnd : event.timeEnd + event.delay;
}

/**
 * How far an offset reset moved the schedule, the baseline the runtime keeps
 * 0 when the offset is measured from the plan
 */
export function getScheduleShift(offset: Pick<Offset, 'absolute' | 'relative'>): Duration {
  return (offset.absolute - offset.relative) as Duration;
}

export function getExpectedStart(
  event: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'delay'>,
  state: {
    currentDay: number; // the current day from the rundown
    totalGap: number;
    isLinkedToLoaded: boolean;
    /** the offset since the last reset, or from the plan when there is none */
    offset: number;
    /** how far the last reset moved the schedule, the absolute offset minus the relative */
    scheduleShift: Duration;
  },
): number {
  const { dayOffset } = event;
  const { currentDay, totalGap, isLinkedToLoaded, offset, scheduleShift } = state;

  //How many days from the currently running event to this one
  const relativeDayOffset = dayOffset - currentDay;

  const delayedStart = getDelayedStart(event);

  //The normalised start time of this event relative to the currently running event
  const normalisedTimeStart = delayedStart + relativeDayOffset * dayInMs;

  // a reset moves the schedule to where playback was
  const scheduledStartTime = normalisedTimeStart + scheduleShift;

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
  event: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'duration' | 'countToEnd' | 'delay'>,
  expectedStart: number,
  currentRuntimeDay: number,
  isLoaded: boolean,
): number {
  /**
   * Count to end events end on their planned time, a delay does not move them
   * the loaded one follows the runtime offset, which holds the time given to it
   */
  if (event.countToEnd && isLoaded) {
    return expectedStart - event.delay + event.duration;
  }

  /**
   * Count to end events after the loaded one also absorb the offset
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
