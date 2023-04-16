import { OntimeEvent, OntimeRundownEntry, SupportedEvent } from 'ontime-types';

import { formatTime } from './time';

/**
 * @description From a list of events, returns only events of type event with calculated delays
 * @param {Object[]} rundown - given rundown
 * @returns {Object[]} Filtered events with calculated delays
 */

export const getEventsWithDelay = (rundown: OntimeRundownEntry[]): OntimeEvent[] => {
  if (rundown == null) return [];

  const delayedEvents: OntimeEvent[] = [];

  // Add running delay
  let delay = 0;
  for (const event of rundown) {
    if (event.type === SupportedEvent.Block) delay = 0;
    else if (event.type === SupportedEvent.Delay) {
      if (typeof event.duration === 'number') {
        delay += event.duration;
      }
    } else if (event.type === SupportedEvent.Event) {
      const delayedEvent = { ...event };
      if (delay !== 0) {
        delayedEvent.timeStart = Math.max(delayedEvent.timeStart + delay, 0);
        delayedEvent.timeEnd = Math.max(delayedEvent.timeEnd + delay, 0);
      }
      delayedEvents.push(delayedEvent);
    }
  }

  return delayedEvents;
};

/**
 * @description Returns trimmed event list array
 * @param {Object[]} rundown - given rundown
 * @param {string} selectedId - id of currently selected event
 * @param {number} limit - max number of events to return
 * @returns {Object[]} Event list with maximum <limit> objects
 */
export const trimRundown = (rundown: OntimeRundownEntry[], selectedId: string, limit: number) => {
  if (rundown == null) return [];

  const BEFORE = 2;
  const trimmedRundown = [...rundown];

  // limit events length if necessary
  if (limit != null) {
    while (trimmedRundown.length > limit) {
      const idx = trimmedRundown.findIndex((e) => e.id === selectedId);
      if (idx <= BEFORE) {
        trimmedRundown.pop();
      } else {
        trimmedRundown.shift();
      }
    }
  }
  return trimmedRundown;
};

type FormatEventListOptionsProp = {
  showEnd?: boolean;
};
/**
 * @description Returns list of events formatted to be displayed
 * @param {Object[]} rundown - given rundown
 * @param {string} selectedId - id of currently selected event
 * @param {string} nextId - id of next event
 * @param {object} [options]
 * @param {boolean} [options.showEnd] - whether to show the end time
 * @returns {Object[]} Formatted list of events [{time: -, title: -, isNow, isNext}]
 */
export const formatEventList = (
  rundown: OntimeEvent[],
  selectedId: string,
  nextId: string,
  options: FormatEventListOptionsProp,
) => {
  if (rundown == null) return [];
  const { showEnd = false } = options;

  const givenEvents = [...rundown];

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

/**
 * Gets first event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @return {OntimeEvent | null}
 */
export function getFirstEvent(rundown: OntimeRundownEntry[]) {
  return rundown.length ? rundown[0] : null;
}

/**
 * Gets next event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {OntimeEvent | null}
 */
export function getNextEvent(rundown: OntimeRundownEntry[], currentId: string) {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index !== -1 && index + 1 < rundown.length) {
    return rundown[index + 1];
  } else {
    return null;
  }
}

/**
 * Gets previous event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {OntimeEvent | null}
 */
export function getPreviousEvent(rundown: OntimeRundownEntry[], currentId: string) {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index !== -1 && index - 1 >= 0) {
    return rundown[index - 1];
  } else {
    return null;
  }
}
