import { OntimeEvent, OntimeRundown, isOntimeEvent, RundownCached } from 'ontime-types';

import * as cache from './rundownCache.js';

//TODO: https://github.com/cpvalente/ontime/pull/854#discussion_r1555086645

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
 * returns an event given its index after filtering for OntimeEvents
 * @param {number} eventIndex
 * @return {OntimeEvent | undefined}
 * @deprecated
 */
export function getEventAtIndex(eventIndex: number): OntimeEvent | undefined {
  const timedEvents = getTimedEvents();
  return timedEvents.at(eventIndex);
}

/**
 * returns first event that matches a given ID
 * @param {string} eventId
 * @return {object | undefined}
 * @deprecated
 */
export function getEventWithId(eventId: string): OntimeEvent | undefined {
  const timedEvents = getTimedEvents();
  return timedEvents.find((event) => event.id === eventId);
}
