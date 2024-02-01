import {
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeRundown,
  OntimeRundownEntry,
} from 'ontime-types';
import { generateId, swapOntimeEvents } from 'ontime-utils';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { getCached, runtimeCacheStore } from '../../stores/cachingStore.js';
import { isProduction } from '../../setup.js';
import { deleteAtIndex, insertAtIndex, reorderArray } from '../../utils/arrayUtils.js';
import { createPatch } from '../../utils/parser.js';
import { applyDelay, calculateRuntimeDelays, calculateRuntimeDelaysFromIndex, getDelayAt } from './delayUtils.js';

type NormalisedRundown = Record<string, OntimeRundownEntry>;

let rundown: NormalisedRundown = {};
let order: string[] = [];
let revision = 0;
let isStale = true;

/**
 * Utility initialises cache
 * @param persistedRundown
 */
function init(persistedRundown: Readonly<OntimeRundown>) {
  // we decided to try and re-write this dataset for every change
  // instead of maintaining logic to update it
  rundown = {};
  order = [];

  let accumulatedDelay = 0;
  for (let i = 0; i < persistedRundown.length; i++) {
    const event = persistedRundown[i];

    // calculate delays
    if (isOntimeDelay(event)) {
      accumulatedDelay += event.duration;
    } else if (isOntimeBlock(event)) {
      accumulatedDelay = 0;
    } else if (isOntimeEvent(event)) {
      event.delay = accumulatedDelay;
    }

    order.push(event.id);
    rundown[event.id] = { ...event };
  }
  isStale = false;
}

/**
 * Returns an ID guaranteed to be unique
 * @returns
 */
export function getUniqueId(persistedRundown: Readonly<OntimeRundown> = getPersistedRundown()): string {
  let id = '';
  do {
    id = generateId();
  } while (!isIdUnique(persistedRundown, id));
  return id;
}

export function isIdUnique(persistedRundown: Readonly<OntimeRundown>, eventId: string) {
  if (isStale) {
    init(persistedRundown);
  }
  return !Object.hasOwn(rundown, eventId);
}

export function getIndexOf(eventId: string) {
  if (isStale) {
    init(getPersistedRundown());
  }
  return order.indexOf(eventId);
}

/**
 * Utility function gets rundown from DataProvider
 * @returns {OntimeRundown}
 */
export const getPersistedRundown = (): OntimeRundown => DataProvider.getRundown();

type RundownCache = {
  rundown: NormalisedRundown;
  order: string[];
  revision: number;
};

/**
 * Returns cached data
 * @returns {RundownCache}
 */
export function get(): Readonly<RundownCache> {
  if (isStale) {
    console.time('rundownCache__init');
    init(getPersistedRundown());
    console.timeEnd('rundownCache__init');
  }
  return {
    rundown,
    order,
    revision,
  };
}

type CommonParams = { persistedRundown: OntimeRundown };
type MutationParams<T> = T & Partial<CommonParams>;

type MutatingFn<T extends object> = (params: MutationParams<T>) => { newRundown: OntimeRundown };
/**
 * Decorators injects data into mutation
 * @param mutation
 * @returns
 */
export function mutateCache<T extends object>(mutation: MutatingFn<T>) {
  async function scopedMutation(params: T) {
    const persistedRundown = getPersistedRundown();
    const { newRundown } = mutation({ ...params, persistedRundown });

    revision = revision + 1;
    isStale = true;

    DataProvider.setRundown(newRundown);
    // schedule the update to the next tick
    process.nextTick(() => {
      init(newRundown);
    });

    // TODO: could we return a patch object?
  }
  return scopedMutation;
}

type AddArgs = MutationParams<{ atIndex: number; event: OntimeRundownEntry }>;
export function add({ persistedRundown, atIndex, event }: AddArgs): { newRundown: OntimeRundown } {
  const newEvent = { ...event };
  const newRundown = insertAtIndex(atIndex, newEvent, persistedRundown);

  return { newRundown };
}

type RemoveArgs = MutationParams<{ eventId: string }>;
export function remove({ persistedRundown, eventId }: RemoveArgs): { newRundown: OntimeRundown } {
  const atIndex = persistedRundown.findIndex((event) => event.id === eventId);
  const newRundown = deleteAtIndex(atIndex, persistedRundown);

  return { newRundown };
}

export function removeAll(): { newRundown: OntimeRundown } {
  return { newRundown: [] };
}

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

/**
 * Keep incremental revision number of rundown for runtime
 */
let rundownRevision = 0;

/**
 * Key of rundown in cache
 */
export const delayedRundownCacheKey = 'delayed-rundown';

/**
 * Invalidates the cached rundown when an inconsistency is found
 * will throw when not in production
 * @param errorMessage
 */
export function invalidateFromError(errorMessage = 'Found mismatch between store and cache') {
  if (isProduction) {
    runtimeCacheStore.invalidate(delayedRundownCacheKey);
  } else {
    throw new Error(errorMessage);
  }
}

/**
 * Returns rundown with calculated delays
 * Ensures request goes through the caching layer
 */
export function getRundownCache() {
  function calculateRundown() {
    const rundown = DataProvider.getRundown();
    return calculateRuntimeDelays(rundown);
  }

  const cached = getCached(delayedRundownCacheKey, calculateRundown);

  return {
    rundown: cached,
    revision: rundownRevision,
  };
}

/**
 * Returns rundown with calculated delays
 * Ensures request goes through the caching layer
 */
export function getDelayedRundown() {
  function calculateRundown() {
    const rundown = DataProvider.getRundown();
    return calculateRuntimeDelays(rundown);
  }

  return getCached(delayedRundownCacheKey, calculateRundown);
}

/**
 * Adds an event in the rundown at given index, ensuring replication to delayed rundown cache
 * @param eventIndex
 * @param event
 */
export async function cachedAdd(eventIndex: number, event: OntimeEvent | OntimeDelay | OntimeBlock) {
  // TODO: create wrapper function
  const rundown = DataProvider.getRundown();
  const newRundown = insertAtIndex(eventIndex, event, rundown);

  const delayedRundown = getDelayedRundown();
  let newDelayedRundown = insertAtIndex(eventIndex, event, delayedRundown);

  // update delay cache
  if (isOntimeEvent(event)) {
    // if it is an event, we need its delay
    (newDelayedRundown[eventIndex] as OntimeEvent).delay = getDelayAt(eventIndex, newDelayedRundown);
  } else {
    // if it is a block or delay, we invalidate from here
    newDelayedRundown = calculateRuntimeDelaysFromIndex(eventIndex, newDelayedRundown);
  }

  runtimeCacheStore.setCached(delayedRundownCacheKey, newDelayedRundown);
  // we need to delay updating this to ensure add operation happens on same dataset
  await DataProvider.setRundown(newRundown);

  rundownRevision++;
}

/**
 * Edits an event in rundown, ensuring replication to delayed rundown cache
 * @param eventId
 * @param patchObject
 */
export async function cachedEdit(
  eventId: string,
  patchObject: Partial<OntimeEvent> | Partial<OntimeBlock> | Partial<OntimeDelay>,
) {
  const makeEvent = (eventFromRundown: OntimeRundownEntry): OntimeRundownEntry => {
    if (isOntimeEvent(eventFromRundown)) {
      const newEvent = createPatch(eventFromRundown, patchObject as OntimeEvent);
      newEvent.revision++;
      return newEvent;
    }

    return { ...eventFromRundown, ...patchObject } as OntimeRundownEntry;
  };

  const indexInMemory = DataProvider.getIndexOf(eventId);
  if (indexInMemory < 0) {
    throw new Error('No event with ID found');
  }

  const updatedRundown = DataProvider.getRundown();
  const eventFromRundown = updatedRundown[indexInMemory];

  const isPatchObjectDifferentFromRundownEvent = Object.entries(patchObject).some(
    ([key, value]) => eventFromRundown[key] !== value,
  );

  if (!isPatchObjectDifferentFromRundownEvent) {
    return eventFromRundown;
  }

  const newEvent = makeEvent(eventFromRundown);
  updatedRundown[indexInMemory] = newEvent;

  let newDelayedRundown = getDelayedRundown();
  if (newDelayedRundown?.[indexInMemory].id !== newEvent.id) {
    invalidateFromError();
  } else {
    newDelayedRundown[indexInMemory] = newEvent;
    if (isOntimeEvent(newEvent)) {
      (newDelayedRundown[indexInMemory] as OntimeEvent).delay = getDelayAt(indexInMemory, newDelayedRundown);
    } else if (isOntimeDelay(newEvent)) {
      // blocks have no reason to change the rundown, from delays we need to recalculate
      newDelayedRundown = calculateRuntimeDelaysFromIndex(indexInMemory, newDelayedRundown);
    }

    runtimeCacheStore.setCached(delayedRundownCacheKey, newDelayedRundown);
  }

  // we need to delay updating this to ensure edit operation happens on same dataset
  await DataProvider.setRundown(updatedRundown);

  rundownRevision++;

  return newEvent;
}

export async function cachedBatchEdit(ids: string[], patchObject: Partial<OntimeEvent>) {
  const cachedEdits = ids.map((id) => cachedEdit(id, patchObject));

  await Promise.allSettled(cachedEdits);
}

/**
 * Deletes an event with given id from rundown, ensuring replication to delayed rundown cache
 * @param eventId
 */
export async function cachedDelete(eventId: string) {
  const eventIndex = DataProvider.getIndexOf(eventId);
  let delayedRundown = getDelayedRundown();

  if (eventIndex < 0) {
    if (delayedRundown.findIndex((event) => event.id === eventId) >= 0) {
      invalidateFromError();
    }
    throw new Error(`Event with id ${eventId} not found`);
  }

  let updatedRundown = DataProvider.getRundown();
  const eventBack = { ...updatedRundown[eventIndex] };
  updatedRundown = deleteAtIndex(eventIndex, updatedRundown);
  if (eventId !== delayedRundown[eventIndex].id) {
    invalidateFromError();
  } else {
    delayedRundown = deleteAtIndex(eventIndex, delayedRundown);
    if (isOntimeDelay(eventBack) || isOntimeBlock(eventBack)) {
      // for events, we do not have to worry
      // the following event, would have taken the place of the deleted event by now
      delayedRundown = calculateRuntimeDelaysFromIndex(eventIndex, delayedRundown);
    }
    runtimeCacheStore.setCached(delayedRundownCacheKey, delayedRundown);
  }
  // we need to delay updating this to ensure edit operation happens on same dataset
  await DataProvider.setRundown(updatedRundown);

  rundownRevision++;
}

/**
 * Reorders an event in the rundown, ensuring replication to delayed rundown cache
 * @param eventId
 * @param from
 * @param to
 */
export async function cachedReorder(eventId: string, from: number, to: number) {
  const indexCheck = DataProvider.getIndexOf(eventId);
  if (indexCheck !== from) {
    invalidateFromError();
    throw new Error('ID not found at index');
  }

  let updatedRundown = DataProvider.getRundown();
  const reorderedEvent = updatedRundown[from];
  updatedRundown = reorderArray(updatedRundown, from, to);

  const delayedRundown = getDelayedRundown();
  if (eventId !== delayedRundown[from].id) {
    invalidateFromError();
  } else {
    // TODO: could we be more granular about updates
    // I fear we need to update both from and to, which could signify more iterations
    runtimeCacheStore.invalidate(delayedRundownCacheKey);
  }

  // we need to delay updating this to ensure edit operation happens on same dataset
  await DataProvider.setRundown(updatedRundown);

  rundownRevision++;

  return reorderedEvent;
}

export async function cachedClear() {
  await DataProvider.clearRundown();
  runtimeCacheStore.setCached(delayedRundownCacheKey, []);
  rundownRevision++;
}

/**
 * Swaps two events
 * @param {string} fromEventId
 * @param {string} toEventId
 */
export async function cachedSwap(fromEventId: string, toEventId: string) {
  const fromEventIndex = DataProvider.getIndexOf(fromEventId);
  const toEventIndex = DataProvider.getIndexOf(toEventId);

  const rundown = DataProvider.getRundown();
  const rundownToUpdate = swapOntimeEvents(rundown, fromEventIndex, toEventIndex);

  const delayedRundown = getDelayedRundown();
  const fromCachedEvent = delayedRundown.at(fromEventIndex);
  const toCachedEvent = delayedRundown.at(toEventIndex);

  if (fromCachedEvent.id !== fromEventId || toCachedEvent.id !== toEventId) {
    // something went wrong, we invalidate the cache
    runtimeCacheStore.invalidate(delayedRundownCacheKey);
  } else {
    const delayedRundownToUpdate = swapOntimeEvents(delayedRundown, fromEventIndex, toEventIndex);
    runtimeCacheStore.setCached(delayedRundownCacheKey, delayedRundownToUpdate);
  }

  await DataProvider.setRundown(rundownToUpdate);

  rundownRevision++;
}

export async function cachedApplyDelay(eventId: string) {
  // update persisted rundown
  const rundown: OntimeRundown = DataProvider.getRundown();
  const persistedRundown = applyDelay(eventId, rundown);

  const delayedRundown = getDelayedRundown();
  const cachedRundown = applyDelay(eventId, delayedRundown);

  // update
  runtimeCacheStore.setCached(delayedRundownCacheKey, cachedRundown);
  await DataProvider.setRundown(persistedRundown);

  rundownRevision++;
}
