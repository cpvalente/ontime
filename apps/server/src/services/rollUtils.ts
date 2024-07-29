import { dayInMs } from 'ontime-utils';
import { PlayableEvent, OntimeEvent, MaybeNumber } from 'ontime-types';

import { RuntimeState } from '../stores/runtimeState.js';
import { timerConfig } from '../config/config.js';

import { normaliseEndTime, skippedOutOfEvent } from './timerUtils.js';

/**
 * Finds current event in a rolling rundown
 */
export function loadRoll(
  playableEvents: PlayableEvent[],
  timeNow: number,
): {
  event: OntimeEvent | null;
  index: MaybeNumber;
  isPending?: boolean;
} {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know that this exists as long as the playbackEvents are not empty
  const firstEvent = playableEvents[0];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know that this exists as long as the playbackEvents are not empty
  const lastEvent = playableEvents.at(-1)!;
  // check that the rundown wraps around midnight
  const wrapsAroundMidnight = firstEvent.timeStart > lastEvent.timeEnd;

  if (!wrapsAroundMidnight) {
    // check whether we are before or after the rundown
    const lastNormalEnd = normaliseEndTime(lastEvent.timeStart, lastEvent.timeEnd);
    const isAfterRundown = timeNow > lastNormalEnd;
    const isBeforeRundown = timeNow < firstEvent.timeStart && !isAfterRundown;

    if (isAfterRundown || isBeforeRundown) {
      return { event: firstEvent, index: 0, isPending: true };
    }
  }

  // we know we are in the middle of the rundown and we need to find the current event
  // account for number of times we went over midnight
  let daySpan = 0;

  for (let i = 0; i < playableEvents.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know this cannot be undefined in this code path
    const event = playableEvents.at(i)!;

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

  // we should never reach this point
  return { event: null, index: null };
}

/**
 * utility checks if we need to trigger an event load
 */
export function checkNeedsEvent(state: RuntimeState, lastIntegrationClockUpdate: number): boolean {
  // we may be waiting for the secondary timer to finish
  if (state.timer.secondaryTimer !== null) {
    return false;
  }

  // time may have skipped
  return skippedOutOfEvent(state, lastIntegrationClockUpdate, timerConfig.skipLimit);
}
