
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
  for (let [k, v] of Object.entries(values)) {
    str = str.replace(k, v);
    console.log(k, v);
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

  // Order events by startTime
  const orderedEvents = sortArrayByProperty(arr, 'timeStart');

  // flags: select first event if several overlapping
  let nowFound = false;

  // exit early if we are past the events
  const lastEvent = orderedEvents[orderedEvents.length - 1];
  const lastNormalEnd = normaliseEndTime(lastEvent.timeStart, lastEvent.timeEnd);
  if (now > lastNormalEnd) {
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

