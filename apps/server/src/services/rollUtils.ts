import { dayInMs, getFirstEvent } from 'ontime-utils';
import { OntimeEvent, MaybeNumber, PlayableEvent, isPlayableEvent } from 'ontime-types';

import { normaliseEndTime } from './timerUtils.js';

/**
 * Finds current event in a rolling rundown
 */
export function loadRoll(
  timedEvents: OntimeEvent[],
  timeNow: number,
): {
  event: PlayableEvent | null;
  index: MaybeNumber;
  isPending?: boolean;
} {
  const { firstEvent } = getFirstEvent(timedEvents);

  if (!firstEvent) {
    return { event: null, index: null };
  }

  // we know we are in the middle of the rundown and we need to find the current event
  // account for number of times we went over midnight
  let daySpan = 0;

  for (let i = 0; i < timedEvents.length; i++) {
    const event = timedEvents[i];

    if (!isPlayableEvent(event)) {
      continue;
    }

    // we check if event crosses midnight
    if (event.timeStart > event.timeEnd) {
      daySpan++;
    }

    const correctedDays = dayInMs * daySpan;
    const correctedStart = event.timeStart + correctedDays;
    const correctedEnd = event.timeEnd + correctedDays;

    /**
     * there are 3 possible states for an event
     * 1. event is already finished
     * 2. event is running
     * 3. event is in the future
     */

    // 1. event is already finished
    // when does the event end (handle midnight)
    const normalEnd = normaliseEndTime(correctedStart, correctedEnd);
    if (normalEnd <= timeNow) {
      continue;
    }

    // 2. event is running and is the first event in our time slot
    const isFromDayBefore = normalEnd > dayInMs && timeNow < event.timeEnd;
    const hasStarted = isFromDayBefore || timeNow >= event.timeStart;
    if (hasStarted) {
      return { event, index: i };
    }

    // 3. event will run in the future
    // we set the isPending flag to indicate that the event is currently playing
    return { event, index: i, isPending: true };
  }

  // in case we were unable to find anything, we load the first event
  return { event: firstEvent, index: 0, isPending: true };
}

/**
 * Utility function, checks whether the event start is the day after
 */
export function normaliseRollStart(start: number, clock: number) {
  return start < clock ? start + dayInMs : start;
}
