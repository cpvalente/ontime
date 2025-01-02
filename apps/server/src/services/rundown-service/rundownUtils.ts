import { OntimeEvent, OntimeRundown, RundownCached, OntimeRundownEntry, PlayableEvent } from 'ontime-types';
import { filterPlayable, filterTimedEvents } from 'ontime-utils';

import * as cache from './rundownCache.js';

/**
 * returns the normalised rundown
 */
export function getNormalisedRundown(): RundownCached {
  return cache.get();
}

/**
 * returns entire unfiltered rundown
 */
export function getRundown(): OntimeRundown {
  return cache.getCachedRundown();
}

/**
 * returns all events of type OntimeEvent
 */
export function getTimedEvents(): OntimeEvent[] {
  return filterTimedEvents(getRundown());
}

/**
 * returns all events that can be loaded
 */
export function getPlayableEvents(): PlayableEvent[] {
  return filterPlayable(getRundown());
}

/**
 * returns an event given its index after filtering for OntimeEvents
 */
export function getEventAtIndex(eventIndex: number): OntimeEvent | undefined {
  const timedEvents = getTimedEvents();
  return timedEvents.at(eventIndex);
}

/**
 * returns first event that matches a given ID
 */
export function getEventWithId(eventId: string): OntimeRundownEntry | undefined {
  const rundown = getRundown();
  return rundown.find((event) => event.id === eventId);
}

/**
 * returns first event that matches a given cue
 */
export function getNextEventWithCue(targetCue: string, currentEventIndex = 0): OntimeEvent | undefined {
  const playableEvents = getPlayableEvents();
  const lowerCaseCue = targetCue.toLowerCase();

  for (let i = currentEventIndex; i < playableEvents.length; i++) {
    const event = playableEvents.at(i);
    if (event?.cue.toLowerCase() === lowerCaseCue) {
      return event;
    }
  }
}

/**
 * finds the previous event
 */
export function findPrevious(currentEventId?: string): OntimeEvent | null {
  const playableEvents = getPlayableEvents();
  if (!playableEvents || !playableEvents.length) {
    return null;
  }

  // if there is no event running, go to first
  if (!currentEventId) {
    return playableEvents.at(0) ?? null;
  }

  const currentIndex = playableEvents.findIndex((event) => event.id === currentEventId);
  const newIndex = Math.max(currentIndex - 1, 0);
  const previousEvent = playableEvents.at(newIndex) ?? null;
  return previousEvent;
}

/**
 * finds the next event
 */
export function findNext(currentEventId?: string): PlayableEvent | null {
  const playableEvents = getPlayableEvents();
  if (!playableEvents.length) {
    return null;
  }

  // if there is no event running, go to first
  if (!currentEventId) {
    return playableEvents.at(0) ?? null;
  }

  const currentIndex = playableEvents.findIndex((event) => event.id === currentEventId);
  const newIndex = currentIndex + 1;
  const nextEvent = playableEvents.at(newIndex);
  return nextEvent ?? null;
}

/**
 * Returns a paginated rundown
 * Exposes a getter function for the rundown for testing
 */
export function getPaginated(
  offset: number,
  limit: number,
  source = getRundown,
): { rundown: OntimeRundownEntry[]; total: number } {
  const rundown = source();
  return {
    rundown: rundown.slice(Math.min(offset, rundown.length), Math.min(offset + limit, rundown.length)),
    total: rundown.length,
  };
}
