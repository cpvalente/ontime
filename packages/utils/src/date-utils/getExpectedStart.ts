import type { MaybeNumber, OntimeEvent } from 'ontime-types';
import { OffsetMode } from 'ontime-types';

import { dayInMs } from './conversionUtils.js';

/**
 * @param event the event that we are counting to
 * @param currentDay the day offset of the currently running event
 * @param totalGap accumulated gap from the current event
 * @param isLinkedToLoaded is this event part of a chain linking back to the current loaded event
 * @param clock
 * @param offset
 * @returns
 */
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

/**
 * Computes the normalised expected end of an event.
 * A countToEnd event is anchored to its fixed wall-clock end: it absorbs the accumulated
 * runtime offset and is not shifted by the relative-start offset, so its expected end is the
 * scheduled end normalised for the day (mirrors getExpectedFinish in the running timer, which
 * returns the raw timeEnd). A regular event's end moves with the runtime offset.
 * The result lives in the same day-normalised space as getExpectedStart (it may exceed dayInMs).
 */
export function getExpectedEnd(
  event: Pick<OntimeEvent, 'timeStart' | 'duration' | 'delay' | 'dayOffset' | 'countToEnd'>,
  state: Parameters<typeof getExpectedStart>[1],
): number {
  if (!event.countToEnd) {
    return getExpectedStart(event, state) + event.duration;
  }

  const delayedStart = Math.max(0, event.timeStart + event.delay);
  const relativeDayOffset = event.dayOffset - state.currentDay;
  return delayedStart + relativeDayOffset * dayInMs + event.duration;
}
