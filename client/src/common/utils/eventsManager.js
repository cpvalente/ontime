import { formatTime } from './time';

/**
 * @description From a list of events, returns only events of type event with calculated delays
 * @param {Object[]} events - given events
 * @returns {Object[]} Filtered events with calculated delays
 */

export const getEventsWithDelay = (events) => {
  if (events == null) return [];

  const unfilteredEvents = [...events];

  // Add running delay
  let delay = 0;
  for (const e of unfilteredEvents) {
    if (e.type === 'block') delay = 0;
    else if (e.type === 'delay') delay = delay + e.duration;
    else if (e.type === 'event' && delay > 0) {
      e.timeStart += delay;
      e.timeEnd += delay;
    }
  }

  // filter just events
  return unfilteredEvents.filter((e) => e.type === 'event');
};

/**
 * @description Returns trimmed event list array
 * @param {Object[]} events - given events
 * @param {string} selectedId - id of currently selected event
 * @param {number} limit - max number of events to return
 * @returns {Object[]} Event list with maximum <limit> objects
 */
export const trimEventlist = (events, selectedId, limit) => {
  if (events == null) return [];

  const BEFORE = 2;
  const trimmedEvents = [...events];

  // limit events length if necessary
  if (limit != null) {
    while (trimmedEvents.length > limit) {
      const idx = trimmedEvents.findIndex((e) => e.id === selectedId);
      if (idx <= BEFORE) {
        trimmedEvents.pop();
      } else {
        trimmedEvents.shift();
      }
    }
  }
  return trimmedEvents;
};

/**
 * @description Returns list of events formatted to be displayed
 * @param {Object[]} events - given events
 * @param {string} selectedId - id of currently selected event
 * @param {string} nextId - id of next event
 * @param {object} [options]
 * @param {boolean} [options.showEnd] - whether to show the end time
 * @returns {Object[]} Formatted list of events [{time: -, title: -, isNow, isNext}]
 */
export const formatEventList = (events, selectedId, nextId, options) => {
  if (events == null) return [];
  const { showEnd = false } = options;

  const givenEvents = [...events];

  // format list
  const formattedEvents = [];
  for (const event of givenEvents) {
    const start = formatTime(event.timeStart)
    const end = formatTime(event.timeEnd);

    formattedEvents.push({
      id: event.id,
      time: showEnd ? `${start} - ${end}` : start,
      title: event.title,
      isNow: event.id === selectedId,
      isNext: event.id === nextId,
      colour: event.colour,
    });
  }

  return formattedEvents;
};
