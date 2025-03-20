import {
  OntimeEvent,
  Rundown,
  OntimeEntry,
  PlayableEvent,
  EntryId,
  RundownEntries,
  ProjectRundowns,
} from 'ontime-types';

import * as cache from './rundownCache.js';

/**
 * returns entire unfiltered rundown
 */
export function getCurrentRundown(): Rundown {
  return cache.getCurrentRundown();
}

/**
 * returns the the project rundown and the order arrays
 */
export function getRundownData() {
  return {
    rundown: cache.getCurrentRundown(),
    rundownOrder: cache.getEventOrder(),
  };
}

/**
 * returns all events of type OntimeEvent
 */
export function getTimedEvents(): OntimeEvent[] {
  const { entries } = cache.get();
  const { timedEventsOrder } = cache.getEventOrder();
  return makeFlatRundownFromOrder(timedEventsOrder, entries);
}

/**
 * Utility flattens a normalised rundown
 */
function makeFlatRundownFromOrder<T>(order: EntryId[], events: RundownEntries): T[] {
  return order.map((id) => events[id] as T);
}

/**
 * returns an event given its index after filtering for OntimeEvents
 */
export function getEventAtIndex(eventIndex: number): OntimeEvent | undefined {
  const { timedEventsOrder } = cache.getEventOrder();
  const eventId = timedEventsOrder[eventIndex];

  if (!eventId) {
    return undefined;
  }
  const { entries } = getCurrentRundown();
  return entries[eventId] as OntimeEvent | undefined;
}

/**
 * returns first event that matches a given ID
 */
export function getEventWithId(eventId: string): OntimeEntry | undefined {
  const { entries } = getCurrentRundown();
  return entries[eventId];
}

/**
 * Utility returns the first playable event in rundown
 */
export function getFirstPlayable(playableOrder: EntryId[]): PlayableEvent | undefined {
  const firstEventId = playableOrder.at(0);
  if (!firstEventId) return;
  return getEventWithId(firstEventId) as PlayableEvent | undefined;
}

/**
 * returns first event that matches a given cue
 */
export function getNextEventWithCue(targetCue: string, currentEventIndex = 0): OntimeEvent | undefined {
  const { playableEventsOrder } = cache.getEventOrder();

  const lowerCaseCue = targetCue.toLowerCase();

  for (let i = currentEventIndex; i < playableEventsOrder.length; i++) {
    const eventId = playableEventsOrder[i];
    const event = getEventWithId(eventId) as PlayableEvent | undefined;
    if (event?.cue.toLowerCase() === lowerCaseCue) {
      return event;
    }
  }
}

/**
 * finds the previous event
 */
export function findPrevious(currentEventId?: string): OntimeEvent | undefined {
  const { playableEventsOrder } = cache.getEventOrder();

  if (!playableEventsOrder.length) {
    return;
  }

  // if there is no event running, go to first
  if (!currentEventId) {
    return getFirstPlayable(playableEventsOrder);
  }

  const currentIndex = playableEventsOrder.findIndex((eventId) => eventId === currentEventId);
  const newIndex = Math.max(currentIndex - 1, 0);
  const previousEventId = playableEventsOrder.at(newIndex);

  if (!previousEventId) {
    return getFirstPlayable(playableEventsOrder);
  }

  return getEventWithId(previousEventId) as PlayableEvent | undefined;
}

/**
 * finds the next event
 */
export function findNext(currentEventId?: string): PlayableEvent | undefined {
  const { playableEventsOrder } = cache.getEventOrder();

  if (!playableEventsOrder.length) {
    return;
  }

  // if there is no event running, go to first
  if (!currentEventId) {
    return getFirstPlayable(playableEventsOrder);
  }

  const currentIndex = playableEventsOrder.findIndex((eventId) => eventId === currentEventId);
  const newIndex = Math.min(currentIndex + 1, playableEventsOrder.length - 1);
  const nextEventId = playableEventsOrder.at(newIndex);

  if (!nextEventId) {
    return getFirstPlayable(playableEventsOrder);
  }

  return getEventWithId(nextEventId) as PlayableEvent | undefined;
}

export function filterTimedEvents(rundown: Rundown, timedEventOrder: EntryId[]): OntimeEvent[] {
  return timedEventOrder.map((id) => rundown.entries[id] as OntimeEvent);
}

/**
 * Gets the first rundown in the project
 * We ensure that the projects always have a rundown
 */
export function getFirstRundown(rundowns: ProjectRundowns): Rundown {
  const firstKey = Object.keys(rundowns)[0];
  return rundowns[firstKey];
}

/**
 * Returns a rundown given its ID
 */
export function getRundownOrThrow(rundowns: ProjectRundowns, rundownId: string): Rundown {
  if (!rundowns[rundownId]) {
    throw new Error(`Rundown with ID ${rundownId} not found`);
  }
  return rundowns[rundownId];
}
