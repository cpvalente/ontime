/**
 * @description From a list of events, returns only events of type event with calculated delays
 * @param {Object[]} events - given events
 * @returns {Object[]} Filtered events with calculated delays
 */
import {stringFromMillis} from "./dateConfig";

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
      if (idx <= BEFORE) { trimmedEvents.pop(); }
      else { trimmedEvents.shift(); }
    }
  }
  return trimmedEvents;
};

/**
 * @description Returns list of events formatted to be displayed
 * @param {Object[]} events - given events
 * @param {string} selectedId - id of currently selected event
 * @returns {Object[]} Formatted list of events [{time: -, title: -}]
 */
export const formatEventList = (events, selectedId) => {
  if (events == null) return [];

  const givenEvents = [...events];

  // format list
  let formattedEvents = [];
  let isNext = false;
  for (const g of givenEvents) {
    const start = stringFromMillis(g.timeStart, false);
    const end = stringFromMillis(g.timeEnd, false);
    const isNow = g.id === selectedId;

    const o = {
      time: `${start} - ${end}`,
      title: g.title,
      isNow,
      isNext,
    }
    isNext = isNow;
    formattedEvents.push(o);
  }

  return formattedEvents;
};


