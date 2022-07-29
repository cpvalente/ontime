import { format, hoursToMilliseconds } from 'date-fns';

import { stringFromMillis } from './time';

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
 * @param {boolean} [showEnd] - whether to show the end time
 * @param {boolean} [format12] - whether to show in 12 hour mode
 * @returns {Object[]} Formatted list of events [{time: -, title: -, isNow, isNext}]
 */
export const formatEventList = (events, selectedId, nextId, showEnd = false, format12 = false) => {
  if (events == null) return [];

  const givenEvents = [...events];

  // format list
  const formattedEvents = [];
  for (const g of givenEvents) {
    const start = format12
      ? format(g.timeStart - hoursToMilliseconds(1), "hh:mm aa")
      : stringFromMillis(g.timeStart, false);

    const end = format12
      ? format(g.timeEnd - hoursToMilliseconds(1), "hh:mm aa")
      : stringFromMillis(g.timeEnd, false);

    formattedEvents.push({
      id: g.id,
      time: showEnd ? `${start} - ${end}` : start,
      title: g.title,
      isNow: g.id === selectedId,
      isNext: g.id === nextId,
      colour: g.colour,
    });
  }

  return formattedEvents;
};
