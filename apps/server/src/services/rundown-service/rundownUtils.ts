import { OntimeEvent, OntimeRundown, isOntimeEvent, RundownCached } from 'ontime-types';

import * as cache from './rundownCache.js';

export function getNormalisedRundown(): RundownCached {
  return cache.get();
}

/**
 * returns entire unfiltered rundown
 * @return {array}
 */
export function getRundown(): OntimeRundown {
  return cache.getPersistedRundown();
}

/**
 * returns all events of type OntimeEvent
 * @return {array}
 */
export function getTimedEvents(): OntimeEvent[] {
  return getRundown().filter((event) => isOntimeEvent(event)) as OntimeEvent[];
}

/**
 * returns all events that can be loaded
 * @return {array}
 */
export function getPlayableEvents(): OntimeEvent[] {
  return getRundown().filter((event) => isOntimeEvent(event) && !event.skip) as OntimeEvent[];
}

/**
 * returns number of events that can be loaded
 * @return {number}
 */
export function getNumEvents(): number {
  return getPlayableEvents().length;
}

/**
 * returns an event given its index after filtering for OntimeEvents
 * @param {number} eventIndex
 * @return {OntimeEvent | undefined}
 */
export function getEventAtIndex(eventIndex: number): OntimeEvent | undefined {
  const timedEvents = getTimedEvents();
  return timedEvents.at(eventIndex);
}

/**
 * returns first event that matches a given ID
 * @param {string} eventId
 * @return {object | undefined}
 */
export function getEventWithId(eventId: string): OntimeEvent | undefined {
  const timedEvents = getTimedEvents();
  return timedEvents.find((event) => event.id === eventId);
}

/**
 * returns first event that matches a given cue
 * @param {string} cue
 * @return {object | undefined}
 */
export function getNextEventWithCue(cue: string, currentEventId?: string): OntimeEvent | undefined {
  // const loaded = curr
  const timedEvents = getPlayableEvents();
  const comparCue = cue.toLowerCase();
  if (currentEventId) {
    const currentIndex = timedEvents.findIndex((event) => event.id === currentEventId);
    const futureEvents = timedEvents.slice(currentIndex);
    return futureEvents.find((event) => event.cue.toLowerCase() === comparCue);
  }
  return timedEvents.find((event) => event.cue.toLowerCase() === comparCue);
}

/**
 * finds the previous event
 * @return {object | undefined}
 */
export function findPrevious(currentEventId?: string): OntimeEvent | null {
  const timedEvents = getPlayableEvents();
  if (!timedEvents || !timedEvents.length) {
    return null;
  }

  // if there is no event running, go to first
  if (!currentEventId) {
    return timedEvents.at(0) ?? null;
  }

  const currentIndex = timedEvents.findIndex((event) => event.id === currentEventId);
  const newIndex = Math.max(currentIndex - 1, 0);
  const previousEvent = timedEvents.at(newIndex) ?? null;
  return previousEvent;
}

/**
 * finds the next event
 * @return {object | undefined}
 */
export function findNext(currentEventId?: string): OntimeEvent | null {
  const timedEvents = getPlayableEvents();
  if (!timedEvents || !timedEvents.length) {
    return null;
  }

  // if there is no event running, go to first
  if (!currentEventId) {
    return timedEvents.at(0) ?? null;
  }

  const currentIndex = timedEvents.findIndex((event) => event.id === currentEventId);
  const newIndex = (currentIndex + 1) % timedEvents.length;
  const nextEvent = timedEvents.at(newIndex);
  return nextEvent ?? null;
}
