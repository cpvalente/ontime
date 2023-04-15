import { OntimeEvent, OntimeRundownEntry, SupportedEvent } from 'ontime-types';

import { formatTime } from './time';

/**
 * @description From a list of events, returns only events of type event with calculated delays
 * @param {Object[]} events - given events
 * @returns {Object[]} Filtered events with calculated delays
 */

export const getEventsWithDelay = (events: OntimeRundownEntry[]): OntimeEvent[] => {
  if (events == null) return [];

  const delayedEvents: OntimeEvent[] = [];

  // Add running delay
  let delay = 0;
  for (const event of events) {
    if (event.type === SupportedEvent.Block) delay = 0;
    else if (event.type === SupportedEvent.Delay) delay = delay + event.duration;
    else if (event.type === SupportedEvent.Event && delay !== 0) {
      delayedEvents.push({
        ...event,
        timeStart: event.timeStart + delay,
        timeEnd: event.timeEnd + delay,
      });
    }
  }

  return delayedEvents;
};

/**
 * @description Returns trimmed event list array
 * @param {Object[]} events - given events
 * @param {string} selectedId - id of currently selected event
 * @param {number} limit - max number of events to return
 * @returns {Object[]} Event list with maximum <limit> objects
 */
export const trimEventlist = (events: OntimeRundownEntry[], selectedId: string, limit: number) => {
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

type FormatEventListOptionsProp = {
  showEnd?: boolean;
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
export const formatEventList = (
  events: OntimeEvent[],
  selectedId: string,
  nextId: string,
  options: FormatEventListOptionsProp,
) => {
  if (events == null) return [];
  const { showEnd = false } = options;

  const givenEvents = [...events];

  // format list
  const formattedEvents = [];
  for (const event of givenEvents) {
    const start = formatTime(event.timeStart);
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

/**
 * @description Creates a safe duplicate of an event
 * @param {object} event
 * @return {object} clean event
 */
type ClonedEvent = OntimeEvent | { after?: string };
export const cloneEvent = (event: OntimeEvent, after?: string): ClonedEvent => {
  return {
    type: SupportedEvent.Event,
    title: event.title,
    subtitle: event.subtitle,
    presenter: event.presenter,
    note: event.note,
    timeStart: event.timeStart,
    timeEnd: event.timeEnd,
    isPublic: event.isPublic,
    skip: event.skip,
    colour: event.colour,
    after: after,
  };
};
