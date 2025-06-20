import {
  CustomField,
  CustomFieldLabel,
  CustomFields,
  EntryId,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  isPlayableEvent,
  MaybeNumber,
  OntimeBlock,
  OntimeEvent,
  OntimeEntry,
  PlayableEvent,
  Rundown,
  RundownEntries,
} from 'ontime-types';
import {
  generateId,
  insertAtIndex,
  reorderArray,
  swapEventData,
  getTimeFromPrevious,
  isNewLatest,
  customFieldLabelToKey,
} from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { createPatch } from '../../utils/parser.js';

import { apply } from './delayUtils.js';
import { calculateDayOffset, handleCustomField, handleLink, hasChanges, isDataStale } from './rundownCacheUtils.js';

let currentRundownId: EntryId = '';
let currentRundown: Rundown = {
  id: '',
  title: '',
  order: [],
  entries: {},
  revision: 0,
};
let persistedCustomFields: CustomFields = {};

/**
 * Get the cached rundown without triggering regeneration
 */
export const getCurrentRundown = (): Rundown => currentRundown;
export const getCustomFields = (): CustomFields => persistedCustomFields;

let playableEventsOrder: EntryId[] = [];
let timedEventsOrder: EntryId[] = [];
let flatIndexOrder: EntryId[] = [];

/**
 * all mutating functions will set this value if there is a need for re-generation
 * but will only be cleared by the generate function
 */
let isStale = true;

/** Allows safely setting the stale state without accidentally clearing it */
function setIsStale() {
  isStale = true;
}

let totalDelay = 0;
let totalDuration = 0;
let totalDays = 0;
let firstStart: MaybeNumber = null;
let lastEnd: MaybeNumber = null;

let links: Record<EntryId, EntryId> = {};

/**
 * Object that contains reference of renamed custom fields
 * Used to rename the custom fields in the events
 * @example
 * {
 *  oldLabel: newLabel
 *  lighting: lx
 * }
 */
export const customFieldChangelog = new Map<string, string>();

/**
 * Keep track of which custom fields are used.
 * This will be handy for when we delete custom fields
 */
let assignedCustomFields: Record<CustomFieldLabel, EntryId[]> = {};

/**
 * Receives a rundown which will be processed and used as the new current rundown
 */
export async function init(initialRundown: Rundown, customFields: Readonly<CustomFields>) {
  currentRundown = structuredClone(initialRundown);
  currentRundownId = initialRundown.id;
  persistedCustomFields = structuredClone(customFields);
  generate();
  await getDataProvider().setRundown(currentRundownId, currentRundown);
  await getDataProvider().setCustomFields(customFields);
}

/**
 * Utility generate cache
 * @private should not be called outside of `rundownCache.ts`
 */
export function generate(initialRundown: Rundown = currentRundown, customFields: CustomFields = persistedCustomFields) {
  function clearIsStale() {
    isStale = false;
  }

  // we decided to re-write this dataset for every change
  // instead of maintaining logic to update it

  assignedCustomFields = {};
  playableEventsOrder = [];
  timedEventsOrder = [];
  flatIndexOrder = [];

  links = {};
  firstStart = null;
  lastEnd = null;
  totalDuration = 0;
  totalDays = 0;
  totalDelay = 0;

  // temporary parsed rundown
  const parsedEntries: RundownEntries = {};
  const parsedOrder: EntryId[] = [];

  /** A playableEvent from the previous iteration */
  let previousEntry: PlayableEvent | null = null;
  /** The playableEvent most forwards in time processed so far */
  let lastEntry: PlayableEvent | null = null;

  for (let i = 0; i < initialRundown.order.length; i++) {
    // we assign a reference to the current entry, this will be mutated in place
    const currentEntryId = initialRundown.order[i];
    const currentEntry = initialRundown.entries[currentEntryId];
    flatIndexOrder.push(currentEntryId);

    if (isOntimeEvent(currentEntry)) {
      currentEntry.delay = 0;
      currentEntry.gap = 0;
      timedEventsOrder.push(currentEntryId);

      // 1. handle links - mutates currentEntry and links
      handleLink(currentEntry, previousEntry, links);

      // 2. handle custom fields - mutates currentEntry
      handleCustomField(customFields, customFieldChangelog, currentEntry, assignedCustomFields);

      totalDays += calculateDayOffset(currentEntry, lastEntry);
      currentEntry.dayOffset = totalDays;

      // update rundown metadata, it only concerns playable events
      if (isPlayableEvent(currentEntry)) {
        playableEventsOrder.push(currentEntryId);
        // fist start is always the first event
        if (firstStart === null) {
          firstStart = currentEntry.timeStart;
        }

        currentEntry.gap = getTimeFromPrevious(currentEntry, lastEntry);

        if (currentEntry.gap === 0) {
          // event starts on previous finish, we add its duration
          totalDuration += currentEntry.duration;
        } else if (currentEntry.gap > 0) {
          // event has a gap, we add the gap and the duration
          totalDuration += currentEntry.gap + currentEntry.duration;
        } else if (currentEntry.gap < 0) {
          // there is an overlap, we remove the overlap from the duration
          // ensuring that the sum is not negative (ie: fully overlapped events)
          // NOTE: we add the gap since it is a negative number
          totalDuration += Math.max(currentEntry.duration + currentEntry.gap, 0);
        }

        // remove eventual gaps from the accumulated delay
        // we only affect positive delays (time forwards)
        if (totalDelay > 0 && currentEntry.gap > 0) {
          totalDelay = Math.max(totalDelay - currentEntry.gap, 0);
        }
        // current event delay is the current accumulated delay
        currentEntry.delay = totalDelay;

        previousEntry = currentEntry;
        // lastEntry is the event with the latest end time
        if (isNewLatest(currentEntry, lastEntry)) {
          lastEntry = currentEntry;
        }
      }
    } else if (isOntimeDelay(currentEntry)) {
      // calculate delays
      // !!! this must happen after handling the links
      totalDelay += currentEntry.duration;
    } else if (isOntimeBlock(currentEntry)) {
      // calculate block - nothing yet
    } else {
      // unknown - type skip it
      // this is needed to get the type guard working when we assign the entry to the rundown
      continue;
    }

    // add id to order
    parsedOrder.push(currentEntry.id);
    // add entry to rundown
    parsedEntries[currentEntry.id] = currentEntry;
  }

  lastEnd = lastEntry?.timeEnd ?? null;
  clearIsStale();
  customFieldChangelog.clear();

  // update the cache values
  currentRundown.entries = parsedEntries;
  currentRundown.order = parsedOrder;

  // The return value is used for testing
  return { rundown: parsedEntries, order: parsedOrder, links, totalDelay, totalDuration, assignedCustomFields };
}

/** Returns an ID guaranteed to be unique */
export function getUniqueId(): string {
  if (isStale) {
    generate();
  }
  let id = '';
  do {
    id = generateId();
  } while (Object.hasOwn(currentRundown.entries, id));
  return id;
}

/** Returns index of an event with a given id */
export function getIndexOf(eventId: EntryId) {
  if (isStale) {
    generate();
  }
  return currentRundown.order.indexOf(eventId);
}

/** Returns id of an event at a given index */
export function getIdOf(index: number) {
  if (isStale) {
    generate();
  }
  return currentRundown.order.at(index);
}

type RundownCache = {
  id: string;
  title: string;
  order: EntryId[];
  entries: RundownEntries;
  revision: number;
  totalDelay: number;
  totalDuration: number;
};

/**
 * Returns the full rundown cache.
 * Will triggering regeneration if data is stale.
 */
export function get(): Readonly<RundownCache> {
  if (isStale) {
    generate();
  }
  return {
    id: currentRundown.id,
    title: currentRundown.title,
    entries: currentRundown.entries,
    order: currentRundown.order,
    revision: currentRundown.revision,
    totalDelay,
    totalDuration,
  };
}

export type RundownMetadata = {
  firstStart: MaybeNumber;
  lastEnd: MaybeNumber;
  totalDelay: number;
  totalDuration: number;
  revision: number;
};

/**
 * Returns calculated metadata from rundown
 * Will triggering regeneration if data is stale.
 */
export function getMetadata(): Readonly<RundownMetadata> {
  if (isStale) {
    generate();
  }

  return {
    firstStart,
    lastEnd,
    totalDelay,
    totalDuration,
    revision: currentRundown.revision,
  };
}

export type RundownOrder = {
  order: EntryId[];
  timedEventsOrder: EntryId[];
  playableEventsOrder: EntryId[];
};

/**
 * Exposes the order of events
 */
export function getEventOrder(): Readonly<RundownOrder> {
  if (isStale) {
    generate();
  }
  return {
    order: currentRundown.order,
    timedEventsOrder,
    playableEventsOrder,
  };
}

type CommonParams = { rundown: Rundown };
type MutationParams<T> = T & CommonParams;
type MutatingReturn = {
  newRundown: Rundown;
  newEvent?: OntimeEntry;
  didMutate: boolean;
};
type MutatingFn<T extends object> = (params: MutationParams<T>) => MutatingReturn;

/**
 * Decorators injects data into mutation
 * ensures order of operations when performing mutations
 */
export function mutateCache<T extends object>(mutation: MutatingFn<T>) {
  function scopedMutation(params: T) {
    // we work on a copy of the rundown
    const rundownCopy = structuredClone(currentRundown);
    const { newEvent, newRundown, didMutate } = mutation({ ...params, rundown: rundownCopy });

    // early return without calling side effects
    if (!didMutate) {
      return { newEvent, newRundown, didMutate };
    }

    newRundown.revision += 1;
    currentRundown = newRundown;

    // schedule a non priority cache update
    setImmediate(() => {
      get();
    });

    // defer writing to the database
    setImmediate(async () => {
      await getDataProvider().setRundown(currentRundownId, currentRundown);
    });

    return { newEvent, newRundown, didMutate };
  }

  return scopedMutation;
}

type AddArgs = MutationParams<{ atIndex: number; event: OntimeEntry }>;
/**
 * Add entry to rundown
 */
export function add({ rundown, atIndex, event }: AddArgs): Required<MutatingReturn> {
  const newEvent: OntimeEntry = { ...event };

  rundown.entries[newEvent.id] = newEvent;
  rundown.order = insertAtIndex(atIndex, newEvent.id, rundown.order);
  setIsStale();
  return { newRundown: rundown, newEvent, didMutate: true };
}

type RemoveArgs = MutationParams<{ eventIds: EntryId[] }>;
/**
 * Remove entry to rundown
 */
export function remove({ rundown, eventIds }: RemoveArgs): MutatingReturn {
  const previousLength = rundown.order.length;
  rundown.order = rundown.order.filter((id) => !eventIds.includes(id));
  for (const id of eventIds) {
    delete rundown.entries[id];
  }
  const didMutate = rundown.order.length !== previousLength;
  if (didMutate) setIsStale();
  return { newRundown: rundown, didMutate };
}

export function removeAll(): MutatingReturn {
  setIsStale();
  return {
    newRundown: {
      id: '',
      title: '',
      order: [],
      entries: {},
      revision: 0,
    },
    didMutate: true,
  };
}

/**
 * Utility function for patching an existing event with new data
 */
function makeEvent<T extends OntimeEntry>(eventFromRundown: T, patch: Partial<T>): T {
  if (isOntimeEvent(eventFromRundown)) {
    const newEvent = createPatch(eventFromRundown, patch as Partial<OntimeEvent>);
    newEvent.revision++;
    return newEvent as T;
  }
  if (isOntimeBlock(eventFromRundown)) {
    const newEvent: OntimeBlock = { ...eventFromRundown, ...patch };
    newEvent.revision++;
    return newEvent as T;
  }

  return { ...eventFromRundown, ...patch } as T;
}

type EditArgs = MutationParams<{ eventId: EntryId; patch: Partial<OntimeEntry> }>;
/**
 * Apply patch to an entry with given id
 */
export function edit({ rundown, eventId, patch }: EditArgs): Required<MutatingReturn> {
  const entry = rundown.entries[eventId];
  if (!entry) {
    // there should be no reason for the entry not to be found
    // check if it exists in the rundown order
    rundown.order = rundown.order.filter((id) => id !== eventId);
    throw new Error('Entry not found');
  }

  // we cannot allow patching to a different type
  if (patch?.type && entry.type !== patch.type) {
    throw new Error('Invalid event type');
  }

  // if nothing changed, nothing to do
  if (!hasChanges(entry, patch)) {
    return { newRundown: rundown, newEvent: entry, didMutate: false };
  }

  const newEvent = makeEvent(entry, patch);
  rundown.entries[newEvent.id] = newEvent;

  // check whether the data warrants recalculation of cache
  const makeStale = isDataStale(patch);

  if (makeStale) {
    setIsStale();
  } else {
    rundown.entries[newEvent.id] = newEvent;
  }

  return { newRundown: rundown, newEvent, didMutate: true };
}

type BatchEditArgs = MutationParams<{ eventIds: EntryId[]; patch: Partial<OntimeEntry> }>;
/**
 * Apply patch to multiple entries
 */
export function batchEdit({ rundown, eventIds, patch }: BatchEditArgs): MutatingReturn {
  for (const eventId of eventIds) {
    edit({ rundown, eventId, patch });
  }
  return { newRundown: rundown, didMutate: true };
}

type ReorderArgs = MutationParams<{ eventId: EntryId; from: number; to: number }>;
/**
 * Reorder two entries
 */
export function reorder({ rundown, eventId, from, to }: ReorderArgs): Required<MutatingReturn> {
  const eventFrom = rundown.entries[eventId];
  if (!eventFrom) {
    throw new Error('Event not found');
  }

  rundown.order = reorderArray(rundown.order, from, to);

  // increment revision of all events in between
  for (let i = from; i <= to; i++) {
    const eventId = rundown.order[i];
    const entry = rundown.entries[eventId];
    if (isOntimeEvent(entry) || isOntimeBlock(entry)) {
      entry.revision += 1;
    }
  }

  setIsStale();
  return { newRundown: rundown, newEvent: eventFrom, didMutate: true };
}

type ApplyDelayArgs = MutationParams<{ delayId: EntryId }>;
/**
 * Apply a delay
 */
export function applyDelay({ rundown, delayId }: ApplyDelayArgs): MutatingReturn {
  apply(delayId, rundown);
  setIsStale();
  return { newRundown: rundown, didMutate: true };
}

type SwapArgs = MutationParams<{ fromId: EntryId; toId: EntryId }>;
/**
 * Swap two entries
 */
export function swap({ rundown, fromId, toId }: SwapArgs): MutatingReturn {
  const fromEvent = rundown.entries[fromId];
  const toEvent = rundown.entries[toId];

  if (!isOntimeEvent(fromEvent) || !isOntimeEvent(toEvent)) {
    throw new Error('Swap only available for OntimeEvents');
  }

  const [newFrom, newTo] = swapEventData(fromEvent, toEvent);

  rundown.entries[fromId] = newFrom;
  rundown.entries[toId] = newTo;

  setIsStale();
  return { newRundown: rundown, didMutate: true };
}

/**
 * Utility for invalidating service cache if a custom field is used
 */
function invalidateIfUsed(label: CustomFieldLabel) {
  if (label in assignedCustomFields) {
    setIsStale();
  }
  // if the field was in use, we mark the cache as stale
  if (label in assignedCustomFields) {
    setIsStale();
  }
  // ... and schedule a cache update
  // schedule a non priority cache update
  setImmediate(async () => {
    generate();
    await getDataProvider().setRundown(currentRundownId, currentRundown);
  });
}

/**
 * Utility for scheduling a non priority custom field persist
 */
function scheduleCustomFieldPersist() {
  setImmediate(async () => {
    await getDataProvider().setCustomFields(persistedCustomFields);
  });
}

/**
 * Sanitises and creates a custom field in the database
 */
export function createCustomField(field: CustomField): CustomFields {
  const { label, type, colour } = field;
  const key = customFieldLabelToKey(label);

  if (key === null) {
    throw new Error('Unable to convert label to a valid key');
  }

  // check if label already exists
  const alreadyExists = Object.hasOwn(persistedCustomFields, key);

  if (alreadyExists) {
    throw new Error('Label already exists');
  }

  // update object and persist
  persistedCustomFields[key] = { label, type, colour };

  scheduleCustomFieldPersist();

  return persistedCustomFields;
}

/**
 * Edits an existing custom field in the database
 */
export function editCustomField(key: string, newField: Partial<CustomField>): CustomFields {
  if (!(key in persistedCustomFields)) {
    throw new Error('Could not find label');
  }

  const existingField = persistedCustomFields[key];
  if (newField.type !== undefined && existingField.type !== newField.type) {
    throw new Error('Change of field type is not allowed');
  }

  if (newField.label === undefined) {
    throw new Error('Missing label');
  }

  const newKey = customFieldLabelToKey(newField.label);
  if (newKey === null) {
    throw new Error('Unable to convert label to a valid key');
  }
  persistedCustomFields[newKey] = { ...existingField, ...newField };

  if (key !== newKey) {
    delete persistedCustomFields[key];
    customFieldChangelog.set(key, newKey);
  }

  scheduleCustomFieldPersist();
  invalidateIfUsed(key);

  return persistedCustomFields;
}

/**
 * Deletes a custom field from the database
 */
export function removeCustomField(label: string): CustomFields {
  if (label in persistedCustomFields) {
    delete persistedCustomFields[label];
  }

  scheduleCustomFieldPersist();
  invalidateIfUsed(label);

  return persistedCustomFields;
}
