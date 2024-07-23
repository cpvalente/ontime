import { dayInMs } from 'ontime-utils';
import { PlayableEvent, OntimeEvent, MaybeNumber } from 'ontime-types';

import { normaliseEndTime } from './timerUtils.js';

/**
 * Finds loading information given a current rundown and time
 * @param {OntimeEvent[]} playableEvents - List of playable events
 * @param {number} timeNow - time now in ms
 */
export const getRollTimers = (
  playableEvents: PlayableEvent[],
  timeNow: number,
): {
  nowIndex: MaybeNumber;
  nextIndex: MaybeNumber;
  nextEvent: OntimeEvent | null;
  nextPublicEvent: OntimeEvent | null;
  currentEvent: OntimeEvent | null;
  currentPublicEvent: OntimeEvent | null;
} => {
  // check that the rundown wraps around midnight
  const firstEvent = playableEvents.at(0)!;
  const lastEvent = playableEvents.at(-1)!;
  const wrapsAroundMidnight = firstEvent.timeStart > lastEvent.timeEnd;
  
  if (!wrapsAroundMidnight) {
    // check whether we are before or after the rundown
    const lastNormalEnd = normaliseEndTime(lastEvent.timeStart, lastEvent.timeEnd);
    const isAfterRundown = timeNow > lastNormalEnd;
    const isBeforeRundown = timeNow < firstEvent.timeStart && !isAfterRundown;

    if (isAfterRundown || isBeforeRundown) {
      return loadEventToStart();
    }
  }

  // 3. we know we are in the middle of the rundown and we need to find the current event
  // initiate nulled objects which may be populated by the loop
  let nextEvent: OntimeEvent | null = null;
  let nextPublicEvent: OntimeEvent | null = null;
  let currentEvent: OntimeEvent | null = null;
  let currentPublicEvent: OntimeEvent | null = null;
  let nowIndex: MaybeNumber = null;
  let nextIndex: MaybeNumber = null;
  let daySpan = 0; // account for number of times we went over midnight

  for (let i = 0; i < playableEvents.length; i++) {
    // we know this cannot be undefined in this code path
    const event = playableEvents.at(i)!;

    // TODO: consider using checkIsNextDay
    // we keep count of how many days the rundown spans
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

    // 1. event is already finished, but may still be the current public event
    // when does the event end (handle midnight)
    const normalEnd = normaliseEndTime(correctedStart, correctedEnd);
    const hasEnded = normalEnd <= timeNow;
    if (hasEnded) {
      // public event might not be the one running
      // but is always the closes to the running event
      if (event.isPublic) {
        currentPublicEvent = event;
      }
      continue;
    }

    // 2. event is running and is the first event in our time slot
    const isFromDayBefore = normalEnd > dayInMs && timeNow < event.timeEnd;
    const hasStarted = isFromDayBefore || timeNow >= event.timeStart;
    if (hasStarted && currentEvent === null) {
      currentEvent = event;
      nowIndex = i;

      // it could also be public, if not, public events must be in the past
      if (event.isPublic) {
        currentPublicEvent = event;
      }
      continue;
    }

    // 3. event will run in the future, we look for the next events
    // ... backstage next, is always the immediately after
    if (nextEvent === null) {
      nextEvent = event;
      nextIndex = i;
    }

    // ... public
    if (event.isPublic && nextPublicEvent === null) {
      nextPublicEvent = event;
    }

    // if we already know the next event and the next public event
    // we can break out of the loop
    if (nextEvent !== null && nextPublicEvent !== null) {
      break;
    }
  }

  return {
    currentEvent,
    currentPublicEvent,
    nextEvent,
    nextIndex,
    nextPublicEvent,
    nowIndex,
  };

  /**
   * Utility handles the case where dont have a current event
   * and want to prepare the first event of the rundown
   * @returns
   */
  function loadEventToStart() {
    // our next event will be the first one in the rundown
    // we know that the list is not empty, so there is a first event
    const nextEvent = playableEvents.at(0)!;

    // preload first event ...
    let nextPublicEvent = nextEvent;

    // ... and find the public one
    if (!firstEvent.isPublic) {
      // dev note: we feel that this is more efficient than filtering
      // since the next event will likely be close to the one playing
      for (const event of playableEvents) {
        if (event.isPublic) {
          nextPublicEvent = event;
          break;
        }
      }
    }

    return {
      currentEvent: null,
      currentPublicEvent: null,
      nextEvent,
      nextIndex: 0,
      nextPublicEvent,
      nowIndex: null,
    };
  }
};
