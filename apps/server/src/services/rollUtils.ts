import { OntimeEvent } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

/**
 * handle events that span over midnight
 */
export const normaliseEndTime = (start: number, end: number) => (end < start ? end + dayInMs : end);

/**
 * @description Sorts an array of objects by given property
 * @param {array} arr - array to be sorted
 * @param {string} property - property to compare
 * @returns {array} copy of array sorted in ascending order
 */

export const sortArrayByProperty = <T>(arr: T[], property: string): T[] => {
  return [...arr].sort((a, b) => {
    return a[property] - b[property];
  });
};

/**
 * Finds loading information given a current rundown and time
 * @param {OntimeEvent[]} rundown - List of playable events
 * @param {number} timeNow - time now in ms
 * @returns {{}}
 */
export const getRollTimers = (rundown: OntimeEvent[], timeNow: number) => {
  let nowIndex: number | null = null; // index of event now
  let nowId: string | null = null; // id of event now
  let publicIndex: number | null = null; // index of public event now
  let nextIndex: number | null = null; // index of next event
  let publicNextIndex: number | null = null; // index of next public event
  let timeToNext: number | null = null; // counter: time for next event
  let publicTimeToNext: number | null = null; // counter: time for next public event

  const orderedEvents = sortArrayByProperty(rundown, 'timeStart');
  const lastEvent = orderedEvents[orderedEvents.length - 1];
  const lastNormalEnd = normaliseEndTime(lastEvent.timeStart, lastEvent.timeEnd);

  let nextEvent: OntimeEvent | null = null;
  let nextPublicEvent: OntimeEvent | null = null;
  let currentEvent: OntimeEvent | null = null;
  let currentPublicEvent: OntimeEvent | null = null;

  if (timeNow > lastNormalEnd) {
    // we are past last end
    // preload first and find next

    const firstEvent = orderedEvents[0];
    nextIndex = 0;
    nextEvent = firstEvent;
    timeToNext = firstEvent.timeStart + dayInMs - timeNow;

    if (firstEvent.isPublic) {
      nextPublicEvent = firstEvent;
      publicNextIndex = 0;
    } else {
      // look for next public
      // dev note: we feel that this is more efficient than filtering
      // since the next event will likely be close to the one playing
      for (const event of orderedEvents) {
        if (event.isPublic) {
          nextPublicEvent = event;
          // we need the index before this was sorted
          publicNextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
          break;
        }
      }
    }
  } else {
    // flags: select first event if several overlapping
    let nowFound = false;
    // keep track of the end times when looking for public
    let publicTime = -1;

    for (const event of orderedEvents) {
      // When does the event end (handle midnight)
      const normalEnd = normaliseEndTime(event.timeStart, event.timeEnd);

      const hasNotEnded = normalEnd > timeNow;
      // TODO: we will likely want a better solution than the modulus here
      const isFromDayBefore = normalEnd > dayInMs && timeNow < event.timeEnd % dayInMs;
      const hasStarted = isFromDayBefore || timeNow >= event.timeStart;

      if (normalEnd <= timeNow) {
        // event ran already

        if (event.isPublic && normalEnd > publicTime) {
          // public event might not be the one running
          publicTime = normalEnd;
          currentPublicEvent = event;
          publicIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }
      } else if (hasNotEnded && hasStarted && !nowFound) {
        // event is running
        currentEvent = event;
        nowIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        nowId = event.id;
        nowFound = true;

        // it could also be public
        if (event.isPublic) {
          publicTime = normalEnd;
          currentPublicEvent = event;
          publicIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }
      } else if (normalEnd > timeNow) {
        // event will run

        // we already know whats next and next-public
        if (nextIndex !== null && publicNextIndex !== null) {
          continue;
        }

        // look for next events
        // check how far the start is from now
        const timeToEventStart = event.timeStart - timeNow;

        // we don't have a next or this one starts sooner than current next
        if (nextIndex === null || timeToEventStart < timeToNext) {
          timeToNext = timeToEventStart;
          nextEvent = event;
          nextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }

        if (event.isPublic) {
          // if we don't have a public next or this one start sooner than assigned next
          if (publicNextIndex === null || timeToEventStart < publicTimeToNext) {
            publicTimeToNext = timeToEventStart;
            nextPublicEvent = event;
            publicNextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
          }
        }
      }
    }
  }

  return {
    nowIndex,
    nowId,
    publicIndex,
    nextIndex,
    publicNextIndex,
    timeToNext,
    nextEvent,
    nextPublicEvent,
    currentEvent,
    currentPublicEvent,
  };
};

type CurrentTimers = {
  selectedEventId: string | null;
  current: number | null;
  _finishAt: number | null;
  clock: number | null;
  secondaryTimer: number | null;
  secondaryTarget: number | null;
};

/**
 * @description Implements update functions for roll mode
 * @param {CurrentTimers} currentTimers
 * @returns {object} object with selection variables
 */
export const updateRoll = (currentTimers: CurrentTimers) => {
  const { selectedEventId, current, _finishAt, clock, secondaryTimer, secondaryTarget } = currentTimers;

  // timers
  let updatedTimer = current;
  let updatedSecondaryTimer = secondaryTimer;
  // whether rollLoad should be called: force reload of events
  let doRollLoad = false;
  // whether finished event should trigger
  let isPrimaryFinished = false;

  if (selectedEventId && current !== null) {
    // if we have something selected and a timer, we are running

    updatedTimer = _finishAt - clock;
    if (updatedTimer > dayInMs) {
      updatedTimer -= dayInMs;
    }

    if (updatedTimer < 0) {
      isPrimaryFinished = true;
      // we need a new event
      doRollLoad = true;
    }
  } else if (secondaryTimer >= 0) {
    // if secondaryTimer is running we are in waiting to roll

    updatedSecondaryTimer = secondaryTarget - clock;

    if (updatedSecondaryTimer <= 0) {
      // we need a new event
      doRollLoad = true;
    }
  }

  return { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished: isPrimaryFinished };
};
