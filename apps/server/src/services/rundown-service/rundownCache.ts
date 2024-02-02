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
import { generateId, deleteAtIndex, insertAtIndex, reorderArray, swapEventData } from 'ontime-utils';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { getCached, runtimeCacheStore } from '../../stores/cachingStore.js';
import { isProduction } from '../../setup.js';
import { createPatch } from '../../utils/parser.js';
import { apply, calculateRuntimeDelays, calculateRuntimeDelaysFromIndex, getDelayAt } from './delayUtils.js';

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
type MutatingReturn = {
  newRundown: OntimeRundown;
  newEvent?: OntimeRundownEntry;
};
type MutatingFn<T extends object> = (params: MutationParams<T>) => MutatingReturn;
/**
 * Decorators injects data into mutation
 * @param mutation
 * @returns
 */
export function mutateCache<T extends object>(mutation: MutatingFn<T>) {
  async function scopedMutation(params: T) {
    const persistedRundown = getPersistedRundown();
    const { newEvent, newRundown } = mutation({ ...params, persistedRundown });

    revision = revision + 1;
    isStale = true;

    DataProvider.setRundown(newRundown);
    // schedule the update to the next tick
    process.nextTick(() => {
      init(newRundown);
    });

    // TODO: could we return a patch object?
    return { newEvent };
  }
  return scopedMutation;
}

type AddArgs = MutationParams<{ atIndex: number; event: OntimeRundownEntry }>;
export function add({ persistedRundown, atIndex, event }: AddArgs): Required<MutatingReturn> {
  const newEvent: OntimeRundownEntry = { ...event };
  const newRundown = insertAtIndex(atIndex, newEvent, persistedRundown);

  return { newRundown, newEvent };
}

type RemoveArgs = MutationParams<{ eventId: string }>;
export function remove({ persistedRundown, eventId }: RemoveArgs): MutatingReturn {
  const atIndex = persistedRundown.findIndex((event) => event.id === eventId);
  const newRundown = deleteAtIndex(atIndex, persistedRundown);

  return { newRundown };
}

export function removeAll(): { newRundown: OntimeRundown } {
  return { newRundown: [] };
}

/**
 * Utility function for patching events
 * @param eventFromRundown
 * @param patch
 * @returns
 */
function makeEvent(eventFromRundown: OntimeRundownEntry, patch: Partial<OntimeRundownEntry>): OntimeRundownEntry {
  if (isOntimeEvent(eventFromRundown)) {
    const newEvent = createPatch(eventFromRundown, patch as OntimeEvent);
    newEvent.revision++;
    return newEvent;
  }
  // TODO: exhaustive check
  return { ...eventFromRundown, ...patch } as OntimeRundownEntry;
}

type EditArgs = MutationParams<{ eventId: string; patch: Partial<OntimeRundownEntry> }>;
export function edit({ persistedRundown, eventId, patch }: EditArgs): Required<MutatingReturn> {
  const indexAt = persistedRundown.findIndex((event) => event.id === eventId);

  if (indexAt < 0) {
    throw new Error('Event not found');
  }

  if (patch?.type && persistedRundown[indexAt].type !== patch.type) {
    throw new Error('Invalid event type');
  }

  const eventInMemory = persistedRundown[indexAt];
  const newEvent = makeEvent(eventInMemory, patch);
  const newRundown = [...persistedRundown];
  newRundown[indexAt] = newEvent;

  return { newRundown, newEvent };
}

type BatchEditArgs = MutationParams<{ eventIds: string[]; patch: Partial<OntimeRundownEntry> }>;
export function batchEdit({ persistedRundown, eventIds, patch }: BatchEditArgs): MutatingReturn {
  const ids = new Set(eventIds);

  const newRundown = [];
  for (let i = 0; i < persistedRundown.length; i++) {
    if (ids.has(persistedRundown[i].id)) {
      if (patch?.type && persistedRundown[i].type !== patch.type) {
        continue;
      }
      const newEvent = makeEvent(persistedRundown[i], patch);
      newRundown.push(newEvent);
    } else {
      newRundown.push(persistedRundown[i]);
    }
  }
  return { newRundown };
}

type ReorderArgs = MutationParams<{ eventId: string; from: number; to: number }>;
export function reorder({ persistedRundown, eventId, from, to }: ReorderArgs): Required<MutatingReturn> {
  const event = persistedRundown[from];
  if (!event || eventId !== event.id) {
    throw new Error('Event not found');
  }

  const newRundown = reorderArray(persistedRundown, from, to);
  for (let i = from; i <= to; i++) {
    const event = newRundown.at(i);
    if (isOntimeEvent(event)) {
      event.revision += 1;
    }
  }
  return { newRundown, newEvent: newRundown.at(from) };
}

type ApplyDelayArgs = MutationParams<{ eventId: string }>;
export function applyDelay({ persistedRundown, eventId }: ApplyDelayArgs): MutatingReturn {
  const newRundown = apply(eventId, persistedRundown);
  return { newRundown };
}

type SwapArgs = MutationParams<{ fromId: string; toId: string }>;
export function swap({ persistedRundown, fromId, toId }: SwapArgs): MutatingReturn {
  const indexA = persistedRundown.findIndex((event) => event.id === fromId);
  const eventA = persistedRundown.at(indexA);

  const indexB = persistedRundown.findIndex((event) => event.id === toId);
  const eventB = persistedRundown.at(indexB);

  if (!isOntimeEvent(eventA) || !isOntimeEvent(eventB)) {
    throw new Error('Swap only available for OntimeEvents');
  }

  const { newA, newB } = swapEventData(eventA, eventB);
  const newRundown = [...persistedRundown];

  newRundown[indexA] = newA;
  (newRundown[indexA] as OntimeEvent).revision += 1;
  newRundown[indexB] = newB;
  (newRundown[indexB] as OntimeEvent).revision += 1;

  return { newRundown };
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

export async function cachedApplyDelay(eventId: string) {
  // update persisted rundown
  const rundown: OntimeRundown = DataProvider.getRundown();
  const persistedRundown = apply(eventId, rundown);

  const delayedRundown = getDelayedRundown();
  const cachedRundown = apply(eventId, delayedRundown);

  // update
  runtimeCacheStore.setCached(delayedRundownCacheKey, cachedRundown);
  await DataProvider.setRundown(persistedRundown);

  rundownRevision++;
}
