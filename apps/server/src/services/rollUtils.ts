import { OntimeEvent } from 'ontime-types';

/**
 * Utility variable: 24 hour in milliseconds .
 */
export const DAY_TO_MS = 86400000;

/**
 * handle events that span over midnight
 */
export const normaliseEndTime = (start: number, end: number) => (end < start ? end + DAY_TO_MS : end);

/**
 * @description Sorts an array of objects by given property
 * @param {array} arr - array to be sorted
 * @param {string} property - property to compare
 * @returns {array} copy of array sorted in ascending order
 */

export const sortArrayByProperty = (arr, property) => {
  return [...arr].sort((a, b) => {
    return a[property] - b[property];
  });
};

/**
 * @description Replaces placeholder variables in string with given data
 * @param {string} str - string to analyse
 * @param {object} values - map of variables: values to use
 * @returns {string} finished string
 */

export const replacePlaceholder = (str, values) => {
  for (const [k, v] of Object.entries(values)) {
    str = str.replace(k, v);
  }
  return str;
};

/**
 * Finds loading information given a current rundown and time
 * @param rundown
 * @param timeNow
 * @returns {{}}
 */
export const getRollTimers = (rundown: OntimeEvent[], timeNow: number) => {
  let nowIndex: number | null = null; // index of event now
  let nowId: string | null = null; // id of event now
  let publicIndex: number | null = null; // index of public event now
  let publicTime = -1;
  let nextIndex: number | null = null; // index of next event
  let publicNextIndex: number | null = null; // index of next public event
  let timeToNext: number | null = null; // counter: time for next event
  let publicTimeToNext: number | null = null; // counter: time for next public event
  let timers = null;

  // Order events by startTime
  const orderedEvents = sortArrayByProperty(rundown, 'timeStart');

  // preload first if we are past events
  const lastEvent = orderedEvents[orderedEvents.length - 1];
  const lastNormalEnd = normaliseEndTime(lastEvent.timeStart, lastEvent.timeEnd);

  let nextEvent = null;
  let nextPublicEvent = null;
  let currentEvent = null;
  let currentPublicEvent = null;

  if (timeNow > lastNormalEnd) {
    nextIndex = 0;
    timeToNext = orderedEvents[0].timeStart + DAY_TO_MS - timeNow;

    // look for next public
    for (const event of orderedEvents) {
      if (event.isPublic) {
        nextPublicEvent = event;
        publicNextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        break;
      }
    }
  } else {
    // flags: select first event if several overlapping
    let nowFound = false;

    // loop through events, look for where we should be
    for (const event of orderedEvents) {
      // When does the event end (handle midnight)
      const normalEnd = normaliseEndTime(event.timeStart, event.timeEnd);

      if (normalEnd <= timeNow) {
        // event ran already

        // public event might not be the one running
        if (event.isPublic && normalEnd > publicTime) {
          publicTime = normalEnd;
          currentPublicEvent = event;
          publicIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }
      } else if (normalEnd > timeNow && timeNow >= event.timeStart && !nowFound) {
        // event is running

        // it could also be public
        if (event.isPublic) {
          publicTime = normalEnd;
          currentPublicEvent = event;
          publicIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }

        currentEvent = event;
        nowIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        nowId = event.id;

        // set timers
        timers = {
          _startedAt: event.timeStart,
          _finishAt: event.timeEnd,
          duration: normalEnd - event.timeStart,
          current: normalEnd - timeNow,
        };
        nowFound = true;
      } else if (normalEnd > timeNow) {
        // event will run

        // no need to look after found first
        if (nextIndex !== null && publicNextIndex !== null) continue;

        // look for next events
        // check how far the start is from now
        const wait = event.timeStart - timeNow;

        if (nextIndex === null || wait < timeToNext) {
          timeToNext = wait;
          nextEvent = event;
          nextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
        }
        if ((publicNextIndex === null || wait < publicTimeToNext) && event.isPublic) {
          publicTimeToNext = wait;
          nextPublicEvent = event;
          publicNextIndex = rundown.findIndex((rundownEvent) => rundownEvent.id === event.id);
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
    timers,
    timeToNext,
    nextEvent,
    nextPublicEvent,
    currentEvent,
    currentPublicEvent,
  };
};

/**
 * @description Implements update functions for roll mode
 * @param {object} currentTimers
 * @param {object} currentTimers.selectedEventId - Id of currently selected event
 * @param {object} currentTimers.current - Running timer
 * @param {object} currentTimers._finishAt - Expected finish time
 * @param {object} currentTimers.clock - time now
 * @param {object} currentTimers.secondaryTimer - secondary timer
 * @param {object} currentTimers._secondaryTarget - finish time of secondary timer
 * @returns {object} object with selection variables
 */
export const updateRoll = (currentTimers) => {
  const { selectedEventId, current, _finishAt, clock, secondaryTimer, _secondaryTarget } = currentTimers;

  // timers
  let updatedTimer = current;
  let updatedSecondaryTimer = secondaryTimer;
  // whether rollLoad should be called
  let doRollLoad = false;
  // whether finished event should trigger
  let isFinished = false;

  if (selectedEventId && current >= 0) {
    // if we have something selected and a timer, we are running
    // this is true because roll never goes into negative times

    // update timer
    updatedTimer = _finishAt - clock;
    if (updatedTimer < 0) {
      isFinished = true;
      updatedTimer = null;
    }
  } else if (secondaryTimer >= 0) {
    // if secondaryTimer is running we are in waiting to roll

    // update secondary
    updatedSecondaryTimer = _secondaryTarget - clock;
  }

  // if nothing is running, we need to find out if
  // a) we just finished an event (finished was set to true)
  // b) we need to look for events
  // this could be caused by a secondary timer or event finished
  const secondaryRunning = updatedSecondaryTimer <= 0 && updatedSecondaryTimer != null;

  if (isFinished || secondaryRunning) {
    // look for events
    doRollLoad = true;
  }

  return { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished };
};
