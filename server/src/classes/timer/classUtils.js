/**
 * Utility variable: 24 hour in milliseconds .
 * @type {number}
 */
export const DAY_TO_MS = 86400000;

/**
 * @description handle events that span over midnight
 * @param {number} start - When does the event start
 * @param {number} end  - When does the event end
 * @returns {number} normalised time
 */
export const normaliseEndTime = (start, end) => (end < start ? end + DAY_TO_MS : end);

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
 * @description Used in roll mode, returns selection variables from array
 * @param {array} arr - event list
 * @param {number} now - time now in millis
 * @returns {object} object with selection variables
 */

export const getSelectionByRoll = (arr, now) => {
  // Events now
  let nowIndex = null; // index of event now
  let nowId = null; // id of event now
  let publicIndex = null; // index of public event now
  let publicTime = -1; // counter:

  // Events next
  let nextIndex = null; // index of next event
  let publicNextIndex = null; // index of next public event
  let timeToNext = null; // counter: time for next event
  let publicTimeToNext = null; // counter: time for next public event

  // current timer
  let timers = null;

  // exit early if there are no events
  if (arr.length < 1) {
    return {
      nowIndex,
      nowId,
      publicIndex,
      nextIndex,
      publicNextIndex,
      timers,
      timeToNext,
    };
  }

  // Order events by startTime
  const orderedEvents = sortArrayByProperty(arr, 'timeStart');

  // preload first if we are past events
  const lastEvent = orderedEvents[orderedEvents.length - 1];
  const lastNormalEnd = normaliseEndTime(lastEvent.timeStart, lastEvent.timeEnd);

  if (now > lastNormalEnd) {
    nextIndex = 0;
    timeToNext = orderedEvents[0].timeStart + DAY_TO_MS - now;

    // look for next public
    for (const e of orderedEvents) {
      if (e.isPublic) {
        publicNextIndex = arr.findIndex((a) => a.id === e.id);
        break;
      }
    }
  } else {
    // flags: select first event if several overlapping
    let nowFound = false;

    // loop through events, look for where we should be
    for (const e of orderedEvents) {
      // When does the event end (handle midnight)
      const normalEnd = normaliseEndTime(e.timeStart, e.timeEnd);

      if (normalEnd <= now) {
        // event ran already

        // public event might not be the one running
        if (e.isPublic && normalEnd > publicTime) {
          publicTime = normalEnd;
          publicIndex = arr.findIndex((a) => a.id === e.id);
        }
      } else if (normalEnd > now && now >= e.timeStart && !nowFound) {
        // event is running

        // it could also be public
        if (e.isPublic) {
          publicTime = normalEnd;
          publicIndex = arr.findIndex((a) => a.id === e.id);
        }

        nowIndex = arr.findIndex((a) => a.id === e.id);
        nowId = e.id;

        // set timers
        timers = {
          _startedAt: e.timeStart,
          _finishAt: e.timeEnd,
          duration: normalEnd - e.timeStart,
          current: normalEnd - now,
        };
        nowFound = true;
      } else if (normalEnd > now) {
        // event will run

        // no need to look after found first
        if (nextIndex !== null && publicNextIndex !== null) continue;

        // look for next events
        // check how far the start is from now
        const wait = e.timeStart - now;

        if (nextIndex === null || wait < timeToNext) {
          timeToNext = wait;
          nextIndex = arr.findIndex((a) => a.id === e.id);
        }
        if ((publicNextIndex === null || wait < publicTimeToNext) && e.isPublic) {
          publicTimeToNext = wait;
          publicNextIndex = arr.findIndex((a) => a.id === e.id);
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
  const { selectedEventId, current, _finishAt, clock, secondaryTimer, _secondaryTarget } =
    currentTimers;

  // timers
  let updatedTimer = current;
  let updatedSecondaryTimer = secondaryTimer;
  // whether rollLoad should be called
  let doRollLoad = false;
  // whether runCycle should be called
  let isFinished = false;

  if (selectedEventId && current >= 0) {
    // if we have something selected and a timer, we are running
    // this is true because roll never goes into negative times

    // update timer
    updatedTimer = _finishAt - clock;
    if (updatedTimer < 0) {
      isFinished = true;
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
