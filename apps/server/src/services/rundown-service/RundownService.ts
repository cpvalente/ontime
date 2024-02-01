import {
  LogOrigin,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeRundown,
  OntimeRundownEntry,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
} from 'ontime-types';
import { getCueCandidate } from 'ontime-utils';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { block as blockDef, delay as delayDef } from '../../models/eventsDefinition.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { runtimeCacheStore } from '../../stores/cachingStore.js';
import {
  cachedApplyDelay,
  cachedBatchEdit,
  cachedReorder,
  cachedSwap,
  delayedRundownCacheKey,
} from './rundownCache.js';
import { logger } from '../../classes/Logger.js';
import { createEvent } from '../../utils/parser.js';
import { updateNumEvents } from '../../stores/runtimeState.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';

import * as cache from './rundownCache.js';

/**
 * Forces rundown to be recalculated
 * To be used when we know the rundown has changed completely
 */
export function forceReset() {
  runtimeService.reset();
  runtimeCacheStore.invalidate(delayedRundownCacheKey);
}

function generateEvent(eventData: Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeBlock>) {
  // we discard any UI provided events and add our own
  const id = cache.getUniqueId();

  if (isOntimeEvent(eventData)) {
    return createEvent(eventData, getCueCandidate(DataProvider.getRundown(), eventData?.after)) as OntimeEvent;
  }

  if (isOntimeDelay(eventData)) {
    return { ...delayDef, duration: eventData.duration ?? 0, id } as OntimeDelay;
  }

  if (isOntimeBlock(eventData)) {
    return { ...blockDef, title: eventData?.title ?? '', id } as OntimeBlock;
  }

  throw new Error('Invalid event type');
}

/**
 * @description creates a new event with given data
 * @param {object} eventData
 * @return {OntimeRundownEntry}
 */
export async function addEvent(eventData: Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeBlock>) {
  // if the user didnt provide an index, we add the event to start
  let atIndex = 0;
  if (eventData?.after !== undefined) {
    const previousIndex = cache.getIndexOf(eventData.after);
    if (previousIndex < 0) {
      logger.warning(LogOrigin.Server, `Could not find event with id ${eventData.after}`);
    } else {
      atIndex = previousIndex + 1;
    }
  }

  // generate a fully formed event from the patch
  const eventToAdd = generateEvent(eventData);
  // modify rundown
  const scopedMutation = cache.mutateCache(cache.add);
  const { newEvent } = await scopedMutation({ atIndex, event: eventToAdd as OntimeRundownEntry });

  notifyChanges({ timer: [newEvent.id], external: true });

  // notify runtime that rundown size has changed
  updateChangeNumEvents();

  return newEvent;
}

/**
 * deletes event by its ID
 * @param eventId
 * @returns {Promise<void>}
 */
export async function deleteEvent(eventId: string) {
  const scopedMutation = cache.mutateCache(cache.remove);
  await scopedMutation({ eventId });

  notifyChanges({ timer: [eventId], external: true });

  // notify event loader that rundown size has changed
  updateChangeNumEvents();
}

/**
 * deletes all events in database
 * @returns {Promise<void>}
 */
export async function deleteAllEvents() {
  const scopedMutation = cache.mutateCache(cache.removeAll);
  await scopedMutation({});

  // no need to modify timer since we will reset
  notifyChanges({ external: true, reset: true });
}

export async function editEvent(patch: Partial<OntimeEvent> | Partial<OntimeBlock> | Partial<OntimeDelay>) {
  if (isOntimeEvent(patch) && patch?.cue === '') {
    throw new Error('Cue value invalid');
  }

  // TODO: validate event against its type

  const scopedMutation = cache.mutateCache(cache.edit);
  const { newEvent } = await scopedMutation({ patch, eventId: patch.id });

  notifyChanges({ timer: [patch.id], external: true });

  return newEvent;
}

export async function batchEditEvents(ids: string[], data: Partial<OntimeEvent>) {
  await cachedBatchEdit(ids, data);

  // notify runtime service of changed events
  runtimeService.update(ids);

  notifyChanges({ timer: ids, external: true });

  // advice socket subscribers of change
  sendRefetch();
}

/**
 * reorders a given event
 * @param {string} eventId - ID of event from, for sanity check
 * @param {number} from - index of event from
 * @param {number} to - index of event to
 * @returns {Promise<void>}
 */
export async function reorderEvent(eventId: string, from: number, to: number) {
  const reorderedItem = await cachedReorder(eventId, from, to);

  notifyChanges({ timer: true, external: true });

  return reorderedItem;
}

export async function applyDelay(eventId: string) {
  await cachedApplyDelay(eventId);

  notifyChanges({ timer: true, external: true });
}

/**
 * swaps two events
 * @param {string} from - id of event from
 * @param {string} to - id of event to
 * @returns {Promise<void>}
 */
export async function swapEvents(from: string, to: string) {
  await cachedSwap(from, to);

  notifyChanges({ timer: true, external: true });
}

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateChangeNumEvents() {
  const numEvents = getPlayableEvents().length;
  updateNumEvents(numEvents);
}

/**
 * Notify services of changes in the rundown
 */
export function notifyChanges(options: { timer?: boolean | string[]; external?: boolean; reset?: boolean }) {
  if (options.timer) {
    // notify timer service of changed events
    // timer can be true or an array of changed IDs
    if (Array.isArray(options.timer)) {
      runtimeService.update(options.timer);
    }
    runtimeService.update();
  }

  if (options.reset) {
    // force rundown to be recalculated
    forceReset();
  }

  if (options.external) {
    // advice socket subscribers of change
    sendRefetch();
  }
}

/**
 * returns entire unfiltered rundown
 * @return {array}
 */
export function getRundown(): OntimeRundown {
  return DataProvider.getRundown();
}

/**
 * returns all events of type OntimeEvent
 * @return {array}
 */
export function getTimedEvents(): OntimeEvent[] {
  return DataProvider.getRundown().filter((event) => isOntimeEvent(event)) as OntimeEvent[];
}

/**
 * returns all events that can be loaded
 * @return {array}
 */
export function getPlayableEvents(): OntimeEvent[] {
  return DataProvider.getRundown().filter((event) => isOntimeEvent(event) && !event.skip) as OntimeEvent[];
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
export function getEventWithCue(cue: string): OntimeEvent | undefined {
  const timedEvents = getTimedEvents();
  return timedEvents.find((event) => event.cue.toLowerCase() === cue.toLowerCase());
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
