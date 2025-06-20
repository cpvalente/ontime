import {
  CustomField,
  CustomFieldLabel,
  CustomFields,
  EntryId,
  isOntimeBlock,
  isOntimeEvent,
  isPlayableEvent,
  OntimeBlock,
  OntimeEvent,
  OntimeEntry,
  Rundown,
  RundownEntries,
} from 'ontime-types';
import { generateId, insertAtIndex, reorderArray, swapEventData, customFieldLabelToKey } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { createPatch } from '../../utils/parser.js';

import type { RundownMetadata } from './rundown.types.js';
import { apply } from './delayUtils.js';
import { hasChanges, isDataStale, makeRundownMetadata, type ProcessedRundownMetadata } from './rundownCache.utils.js';

let currentRundownId: EntryId = '';
let currentRundown: Rundown = {
  id: '',
  title: '',
  order: [],
  flatOrder: [],
  entries: {},
  revision: 0,
};
let projectCustomFields: CustomFields = {};
let rundownMetadata: RundownMetadata = {
  totalDelay: 0,
  totalDuration: 0,
  totalDays: 0,
  firstStart: null,
  lastEnd: null,

  playableEventOrder: [],
  timedEventOrder: [],
  flatEventOrder: [],

  assignedCustomFields: {},
};

/**
 * Get the cached rundown without triggering regeneration
 */
export const getCurrentRundown = (): Rundown => currentRundown;
export const getCustomFields = (): CustomFields => projectCustomFields;

/**
 * all mutating functions will set this value if there is a need for re-generation
 * but will only be cleared by the generate function
 */
let isStale = true;

/** Allows safely setting the stale state without accidentally clearing it */
function setIsStale() {
  isStale = true;
}

/**
 * Object that contains reference of renamed custom fields
 * Used to rename the custom fields in the events
 * @private exported only to simplify testing
 * @example
 * {
 *  oldLabel: newLabel
 *  lighting: lx
 * }
 */
export let customFieldChangelog: Record<string, string> = {};

/**
 * Receives a rundown which will be processed and used as the new current rundown
 */
export async function init(initialRundown: Readonly<Rundown>, customFields: Readonly<CustomFields>) {
  // we clone this objects since we use mutating logic in the cache
  currentRundown = structuredClone(initialRundown);
  currentRundownId = initialRundown.id;
  projectCustomFields = structuredClone(customFields);

  updateCache();

  currentRundownId;
}

/**
 * Utility generate cache
 * @private should not be called outside of `rundownCache.ts`, exported for testing
 */
export function generate(
  initialRundown: Readonly<Rundown>,
  customFields: Readonly<CustomFields>,
): ProcessedRundownMetadata {
  const { process, getMetadata } = makeRundownMetadata(customFields, customFieldChangelog);

  for (let i = 0; i < initialRundown.order.length; i++) {
    // we assign a reference to the current entry, this will be mutated in place
    const currentEntryId = initialRundown.order[i];
    const currentEntry = initialRundown.entries[currentEntryId];
    if (!currentEntry) {
      continue;
    }
    const { processedEntry } = process(currentEntry, null);

    // if the event is a block, we process the nested entries
    // the code here is a copy of the processing of top level events
    if (isOntimeBlock(processedEntry)) {
      let totalBlockDuration = 0;
      let blockStartTime = null;
      let blockEndTime = null;
      let isFirstLinked = false;

      // check if the block contains events
      for (let i = 0; i < processedEntry.events.length; i++) {
        const nestedEntryId = processedEntry.events[i];
        const nestedEntry = initialRundown.entries[nestedEntryId];

        if (!nestedEntry) {
          continue;
        }
        const { processedData: processedNestedData, processedEntry: processedNestedEntry } = process(
          nestedEntry,
          processedEntry.id,
        );

        // we dont extract metadata of skipped events,
        // if this is not a playable event there is  nothing else to do
        if (!isOntimeEvent(processedNestedEntry) || !isPlayableEvent(processedNestedEntry)) {
          continue;
        }

        // first start is always the first event
        if (blockStartTime === null) {
          blockStartTime = processedNestedEntry.timeStart;
          isFirstLinked = Boolean(processedNestedEntry.linkStart);
        }

        // lastEntry is the event with the latest end time
        blockEndTime = processedNestedData.lastEnd;
        totalBlockDuration += processedNestedEntry.duration;
      }

      // update block metadata
      processedEntry.duration = totalBlockDuration;
      processedEntry.startTime = blockStartTime;
      processedEntry.endTime = blockEndTime;
      processedEntry.isFirstLinked = isFirstLinked;
      processedEntry.numEvents = processedEntry.events.length;
    }
  }

  return getMetadata();
}

/**
 * Runs the generate function in the currently loaded rundown and updates caches
 */
export function updateCache() {
  // The stale state can only be cleared inside updateCache()
  function clearIsStale() {
    isStale = false;
  }
  const processedData = generate(currentRundown, projectCustomFields);

  // update the cache values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we are not interested in the iteration data
  const { previousEvent, latestEvent, ...metadata } = processedData;
  currentRundown.entries = metadata.entries;
  currentRundown.order = metadata.order;
  currentRundown.flatOrder = metadata.flatEventOrder;
  rundownMetadata = metadata;
  clearIsStale();
  customFieldChangelog = {};
}

/**
 * Whether a given ID is exists in the current rundown
 */
export function hasId(id: EntryId): boolean {
  return Object.hasOwn(currentRundown.entries, id);
}

/** Returns an ID guaranteed to be unique */
export function getUniqueId(): string {
  if (isStale) {
    updateCache();
  }
  let id = '';
  do {
    id = generateId();
  } while (hasId(id));
  return id;
}

/** Returns index of an entry with a given id */
export function getIndexOf(entryId: EntryId) {
  if (isStale) {
    updateCache();
  }
  return currentRundown.order.indexOf(entryId);
}

/** Returns id of an entry at a given index */
export function getIdOf(index: number) {
  if (isStale) {
    updateCache();
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
    updateCache();
  }
  return {
    id: currentRundown.id,
    title: currentRundown.title,
    entries: currentRundown.entries,
    order: currentRundown.order,
    revision: currentRundown.revision,
    totalDelay: rundownMetadata.totalDelay,
    totalDuration: rundownMetadata.totalDuration,
  };
}

/**
 * Returns calculated metadata from rundown
 * Will triggering regeneration if data is stale.
 */
export function getMetadata(): Readonly<RundownMetadata & { revision: number }> {
  if (isStale) {
    updateCache();
  }

  return {
    ...rundownMetadata,
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
    updateCache();
  }
  return {
    order: currentRundown.order,
    timedEventsOrder: rundownMetadata.timedEventOrder,
    playableEventsOrder: rundownMetadata.playableEventOrder,
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

type AddArgs = MutationParams<{ atIndex: number; parent?: EntryId; entry: OntimeEntry }>;
/**
 * Add entry to rundown
 */
export function add({ rundown, atIndex, parent, entry }: AddArgs): Required<MutatingReturn> {
  const newEntry: OntimeEntry = { ...entry };

  rundown.entries[newEntry.id] = newEntry;

  if (parent) {
    const parentBlock = rundown.entries[parent] as OntimeBlock;
    parentBlock.events = insertAtIndex(atIndex, newEntry.id, parentBlock.events);
  } else {
    rundown.order = insertAtIndex(atIndex, newEntry.id, rundown.order);
  }

  setIsStale();
  return { newRundown: rundown, newEvent: newEntry, didMutate: true };
}

type RemoveArgs = MutationParams<{ eventIds: EntryId[] }>;
/**
 * Remove entries in a rundown
 */
export function remove({ rundown, eventIds }: RemoveArgs): MutatingReturn {
  let didMutate = false;

  for (let i = 0; i < eventIds.length; i++) {
    const entry = rundown.entries[eventIds[i]];
    if (isOntimeEvent(entry) && entry.parent) {
      const parentBlock = rundown.entries[entry.parent] as OntimeBlock;
      edit({
        rundown,
        eventId: entry.parent,
        patch: {
          events: parentBlock.events.filter((id) => id !== eventIds[i]),
          numEvents: parentBlock.events.length - 1,
        },
      });
      parentBlock.events = parentBlock.events.filter((id) => id !== entry.id);
    } else {
      rundown.order = rundown.order.filter((id) => id !== eventIds[i]);
    }
    didMutate = true;
    delete rundown.entries[eventIds[i]];
  }

  if (didMutate) setIsStale();
  return { newRundown: rundown, didMutate };
}

/**
 * Remove all entries of a rundown
 */
export function removeAll(): MutatingReturn {
  setIsStale();
  return {
    newRundown: {
      id: '',
      title: '',
      order: [],
      flatOrder: [],
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
 * Mutates the given rundown
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
  newFrom.revision++;
  newTo.revision++;

  setIsStale();
  return { newRundown: rundown, didMutate: true };
}

/**
 * Utility for invalidating service cache if a custom field is used
 */
function invalidateIfUsed(label: CustomFieldLabel) {
  // if the field was in use, we mark the cache as stale
  if (label in rundownMetadata.assignedCustomFields) {
    setIsStale();
  }
  // ... and schedule a cache update
  // schedule a non priority cache update
  setImmediate(async () => {
    updateCache();
    await getDataProvider().setRundown(currentRundownId, currentRundown);
  });
}

/**
 * Utility for scheduling a non priority custom field persist
 */
function scheduleCustomFieldPersist() {
  setImmediate(async () => {
    await getDataProvider().setCustomFields(projectCustomFields);
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
  const alreadyExists = Object.hasOwn(projectCustomFields, key);

  if (alreadyExists) {
    throw new Error('Label already exists');
  }

  // update object and persist
  projectCustomFields[key] = { label, type, colour };

  scheduleCustomFieldPersist();

  return projectCustomFields;
}

/**
 * Edits an existing custom field in the database
 */
export function editCustomField(key: string, newField: Partial<CustomField>): CustomFields {
  if (!(key in projectCustomFields)) {
    throw new Error('Could not find label');
  }

  const existingField = projectCustomFields[key];
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
  projectCustomFields[newKey] = { ...existingField, ...newField };

  if (key !== newKey) {
    delete projectCustomFields[key];
    customFieldChangelog[key] = newKey;
  }

  scheduleCustomFieldPersist();
  invalidateIfUsed(key);

  return projectCustomFields;
}

/**
 * Deletes a custom field from the database
 */
export function removeCustomField(label: string): CustomFields {
  if (label in projectCustomFields) {
    delete projectCustomFields[label];
  }

  scheduleCustomFieldPersist();
  invalidateIfUsed(label);

  return projectCustomFields;
}
