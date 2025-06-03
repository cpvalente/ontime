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
  OntimeDelay,
} from 'ontime-types';
import { generateId, insertAtIndex, customFieldLabelToKey, mergeAtIndex } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { createBlock } from '../../api-data/rundown/rundown.utils.js';

import type { RundownMetadata } from '../../api-data/rundown/rundown.types.js';
import { makeRundownMetadata, type ProcessedRundownMetadata } from './rundownCache.utils.js';

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
  flatEntryOrder: [],

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
      const blockEvents: EntryId[] = [];

      // check if the block contains events
      for (let i = 0; i < processedEntry.events.length; i++) {
        const nestedEntryId = processedEntry.events[i];
        const nestedEntry = initialRundown.entries[nestedEntryId];

        if (!nestedEntry) {
          continue;
        }

        blockEvents.push(nestedEntry.id);
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
      processedEntry.events = blockEvents;
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
  currentRundown.flatOrder = metadata.flatEntryOrder;
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
  flatOrder: EntryId[];
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
    flatOrder: currentRundown.flatOrder,
    timedEventsOrder: rundownMetadata.timedEventOrder,
    playableEventsOrder: rundownMetadata.playableEventOrder,
  };
}

type CommonParams = { rundown: Rundown };
type MutationParams<T> = T & CommonParams;
type MutatingReturn = {
  newRundown: Rundown;
  newEvent?: OntimeEntry;
  changeList?: EntryId[];
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
    const { newEvent, newRundown, changeList, didMutate } = mutation({ ...params, rundown: rundownCopy });

    // early return without calling side effects
    if (!didMutate) {
      return { newEvent, newRundown, changeList, didMutate };
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

type AddArgs = MutationParams<{ afterId?: string; parent: EntryId | null; entry: OntimeEntry }>;
/**
 * Add entry to rundown, handles the following cases:
 * - 1. add entry in block, after a given entry
 * - 2. add entry in block, at the beginning
 * - 3. add entry to the rundown, after a given entry
 * - 4. add entry to the rundown, at the beginning
 */
export function add({ rundown, afterId, parent, entry }: AddArgs): Required<MutatingReturn> {
  if (parent) {
    const parentBlock = rundown.entries[parent] as OntimeBlock;
    if (afterId) {
      const atEventsIndex = parentBlock.events.indexOf(afterId) + 1;
      const atFlatIndex = rundown.flatOrder.indexOf(afterId) + 1;
      parentBlock.events = insertAtIndex(atEventsIndex, entry.id, parentBlock.events);
      rundown.flatOrder = insertAtIndex(atFlatIndex, entry.id, rundown.flatOrder);
    } else {
      parentBlock.events = insertAtIndex(0, entry.id, parentBlock.events);
      const atFlatIndex = rundown.flatOrder.indexOf(parent) + 1;
      rundown.flatOrder = insertAtIndex(atFlatIndex, entry.id, rundown.flatOrder);
    }
  } else {
    if (afterId) {
      const atOrderIndex = rundown.order.indexOf(afterId) + 1;
      const atFlatIndex = rundown.flatOrder.indexOf(afterId) + 1;
      rundown.order = insertAtIndex(atOrderIndex, entry.id, rundown.order);
      rundown.flatOrder = insertAtIndex(atFlatIndex, entry.id, rundown.flatOrder);
    } else {
      rundown.order = insertAtIndex(0, entry.id, rundown.order);
      rundown.flatOrder = insertAtIndex(0, entry.id, rundown.flatOrder);
    }
  }

  // either way, we insert the entry into the rundown
  rundown.entries[entry.id] = entry;
  setIsStale();
  return { newRundown: rundown, changeList: [], newEvent: entry, didMutate: true };
}

type UngroupArgs = MutationParams<{ blockId: EntryId }>;
/**
 * Deletes a block and moves all its children to the top level order
 * Mutates the given rundown
 * @throws if block ID not found
 */
export function ungroup({ rundown, blockId }: UngroupArgs): MutatingReturn {
  const block = rundown.entries[blockId];
  if (!isOntimeBlock(block)) {
    throw new Error('Block with ID not found');
  }

  // get the events from the block and merge them into the order where the block was
  const nestedEvents = block.events;
  const blockIndex = rundown.order.indexOf(blockId);
  rundown.order.splice(blockIndex, 1, ...nestedEvents);
  rundown.flatOrder = rundown.flatOrder.filter((id) => id !== blockId);

  // delete block from entries and remove its reference from the child events
  delete rundown.entries[blockId];
  for (let i = 0; i < nestedEvents.length; i++) {
    const eventId = nestedEvents[i];
    const entry = rundown.entries[eventId];
    if (!entry) {
      throw new Error('Entry not found');
    }
    (entry as OntimeEvent | OntimeDelay).parent = null;
  }

  return { newRundown: rundown, didMutate: true };
}

type GroupArgs = MutationParams<{ entryIds: EntryId[] }>;
/**
 * Groups a list of entries into a block
 * It ensures that the entries get reassigned parent and the block gets a list of events
 * The block will be created at the index of the first event in the order, not at the lowest index
 * Mutates the given rundown
 * @throws if any of the entries is a block
 * @throws if any of the entries is not found
 */
export function groupEntries({ rundown, entryIds }: GroupArgs): MutatingReturn {
  const block = createBlock({ id: getUniqueId() });

  const nestedEvents: EntryId[] = [];
  let firstIndex = -1;
  for (let i = 0; i < entryIds.length; i++) {
    const entryId = entryIds[i];
    const entry = rundown.entries[entryId];
    if (!entry) {
      throw new Error('Entry not found');
    }

    if (isOntimeBlock(entry)) {
      throw new Error('Cannot group a block');
    }

    if (entry.parent !== null) {
      throw new Error('Entry already has a parent');
    }

    // the block will be created at the first selected event position
    // note that this is not the lowest index
    if (firstIndex === -1) {
      firstIndex = rundown.flatOrder.indexOf(entryId);
    }

    nestedEvents.push(entryId);
    entry.parent = block.id;
    rundown.flatOrder = rundown.flatOrder.filter((id) => id !== entryId);
    rundown.order = rundown.order.filter((id) => id !== entryId);
  }

  block.events = nestedEvents;
  const insertIndex = Math.max(0, firstIndex);
  // we have filtered the items from the order
  // we will insert them now, with only the block at top level ...
  rundown.order = insertAtIndex(insertIndex, block.id, rundown.order);
  /// ... and the nested elements after the block in the flat order
  rundown.flatOrder = mergeAtIndex(insertIndex, [block.id, ...nestedEvents], rundown.flatOrder);
  rundown.entries[block.id] = block;

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
