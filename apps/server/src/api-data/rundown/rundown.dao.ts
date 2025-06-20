/**
 * This module handles interfacing with the stored rundown
 * Additionally it provides a transaction-like interface on a caching layer
 *
 * The mutation functions mutate the rundown in place
 * This is to simplify the logic and avoid multiple copies of the objects
 *
 * The mutations assume that the data has been validated
 * - in shape
 * - in domain
 */

import {
  CustomFields,
  EntryId,
  isOntimeBlock,
  isOntimeEvent,
  isPlayableEvent,
  OntimeBlock,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  PatchWithId,
  Rundown,
} from 'ontime-types';
import { insertAtIndex } from 'ontime-utils';

import { makeRundownMetadata, ProcessedRundownMetadata } from '../../services/rundown-service/rundownCache.utils.js';
import { customFieldChangelog } from '../../services/rundown-service/rundownCache.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

import type { RundownMetadata } from './rundown.types.js';
import {
  applyPatchToEntry,
  cloneBlock,
  cloneEntry,
  createBlock,
  deleteById,
  doesInvalidateMetadata,
  getUniqueId,
} from './rundown.utils.js';

/**
 * The currently loaded rundown in cache
 */
const cachedRundown: Rundown = {
  id: '',
  title: '',
  order: [],
  flatOrder: [], // TODO: remove in favour of the metadata flatEntryOrder
  entries: {},
  revision: 0,
};

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
 * The custom fields that are used in the project
 * Not unique to the loaded rundown
 */
let projectCustomFields: CustomFields = {};

export const getCurrentRundown = (): Readonly<Rundown> => cachedRundown;
export const getProjectCustomFields = (): Readonly<CustomFields> => projectCustomFields;

export function createTransaction() {
  const rundown = structuredClone(cachedRundown);
  const customFields = projectCustomFields;

  function commit(shouldProcess: boolean = true) {
    // schedule a database update
    setImmediate(async () => {
      await getDataProvider().setRundown(cachedRundown.id, cachedRundown);
    });

    const revision = rundown.revision + 1;
    cachedRundown.revision = revision;

    /**
     * Some mutations do not require processing the rundown
     * We simply increment the revision and return the rundown
     */
    if (!shouldProcess) {
      cachedRundown.entries = rundown.entries;
      cachedRundown.order = rundown.order;
      cachedRundown.flatOrder = rundown.flatOrder;
      return { rundown, rundownMetadata, customFields: projectCustomFields, revision: cachedRundown.revision };
    }

    const processedData = processRundown(rundown, projectCustomFields);
    // update the cache values
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we are not interested in the iteration data
    const { previousEvent, latestEvent, previousEntry, entries, order, ...metadata } = processedData;
    cachedRundown.entries = entries;
    cachedRundown.order = order;
    cachedRundown.flatOrder = metadata.flatEntryOrder; // TODO: remove in favour of the metadata flatEntryOrder
    rundownMetadata = metadata;

    return { rundown, rundownMetadata, customFields: projectCustomFields, revision: cachedRundown.revision };
  }

  return {
    customFields,
    rundown,
    commit,
  };
}

/**
 * Add entry to rundown, handles the following cases:
 * - 1a. add entry in block, after a given entry
 * - 1b. add entry in block, at the beginning
 * - 2a. add entry to the rundown, after a given entry
 * - 2b. add entry to the rundown, at the beginning
 */
function add(rundown: Rundown, entry: OntimeEntry, afterId: EntryId | null, parentId: EntryId | null): OntimeEntry {
  if (parentId) {
    // 1. inserting an entry inside a block
    const parentBlock = rundown.entries[parentId] as OntimeBlock;
    if (afterId) {
      const atEventsIndex = parentBlock.events.indexOf(afterId) + 1;
      const atFlatIndex = rundown.flatOrder.indexOf(afterId) + 1;
      parentBlock.events = insertAtIndex(atEventsIndex, entry.id, parentBlock.events);
      rundown.flatOrder = insertAtIndex(atFlatIndex, entry.id, rundown.flatOrder);
    } else {
      parentBlock.events = insertAtIndex(0, entry.id, parentBlock.events);
      const atFlatIndex = rundown.flatOrder.indexOf(parentId) + 1;
      rundown.flatOrder = insertAtIndex(atFlatIndex, entry.id, rundown.flatOrder);
    }
  } else {
    // 2. inserting an entry at top level
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

  return entry;
}

/**
 * Applies a patch of changes to an existing entry
 * @returns { entry: OntimeEntry, didInvalidate: boolean } - didInvalidate indicates whether the change warrants a recalculation of the cache
 */
function edit(rundown: Rundown, patch: PatchWithId): { entry: OntimeEntry; didInvalidate: boolean } {
  const entry = rundown.entries[patch.id];

  // apply the patch and replace the entry
  const newEntry = applyPatchToEntry(entry, patch);
  rundown.entries[entry.id] = newEntry;

  // check whether the data warrants recalculation of cache
  const didInvalidate = doesInvalidateMetadata(patch);

  return { entry: newEntry, didInvalidate };
}

/**
 * Deletes an entry from the rundown
 * - if the entry is an ontime block, we delete it along with its children
 * - if the entry is inside a block, we delete it and remove the reference from the parent block
 */
function remove(rundown: Rundown, entry: OntimeEntry) {
  if (isOntimeBlock(entry)) {
    // for ontime blocks, we need to iterate through the children and delete them
    for (let i = 0; i < entry.events.length; i++) {
      const nestedEntryId = entry.events[i];
      deleteEntry(nestedEntryId);
    }
  } else if (entry.parent) {
    // at this point, we are handling entries inside a block, so we need to remove the reference
    const parentBlock = rundown.entries[entry.parent] as OntimeBlock;
    if (parentBlock) {
      // we call a mutation to the parent event to remove the entry from the events
      const filteredEvents = deleteById(parentBlock.events, entry.id);
      edit(rundown, { id: parentBlock.id, events: filteredEvents });
    }
  }
  deleteEntry(entry.id);

  function deleteEntry(idToDelete: EntryId) {
    rundown.order = deleteById(rundown.order, idToDelete);
    delete rundown.entries[idToDelete];
  }
}

/**
 * Removes all entries from the rundown
 */
function removeAll(rundown: Rundown): Rundown {
  rundown.order = [];
  rundown.flatOrder = [];
  rundown.entries = {};

  return rundown;
}

/**
 * Reorders an entry in the rundown
 * Handle moving across order lists
 */
function reorder(rundown: Rundown, eventFrom: OntimeEntry, eventTo: OntimeEntry, order: 'before' | 'after' | 'insert') {
  // handle moving across parents
  const fromParent: EntryId | null = (eventFrom as { parent?: EntryId })?.parent ?? null;
  const toParent = (() => {
    if (isOntimeBlock(eventTo)) {
      if (order === 'insert') {
        return eventTo.id;
      }
      return null;
    }
    return eventTo.parent ?? null;
  })();

  if (!isOntimeBlock(eventFrom)) {
    eventFrom.parent = toParent;
  }

  const sourceArray = fromParent === null ? rundown.order : (rundown.entries[fromParent] as OntimeBlock).events;
  const destinationArray = toParent === null ? rundown.order : (rundown.entries[toParent] as OntimeBlock).events;

  const fromIndex = sourceArray.indexOf(eventFrom.id);
  const toIndex = (() => {
    const baseIndex = destinationArray.indexOf(eventTo.id);
    if (order === 'before') return baseIndex;
    // only add one if we are moving down
    if (order === 'after') return baseIndex + (fromIndex < baseIndex ? 0 : 1);
    // for insert we add in the end of the array
    return destinationArray.length;
  })();

  // Remove from source array
  sourceArray.splice(fromIndex, 1);

  // Insert into destination array
  destinationArray.splice(toIndex, 0, eventFrom.id);
}

/**
 * Applies delay from given event ID
 * Mutates the given rundown
 */
function applyDelay(rundown: Rundown, delay: OntimeDelay) {
  const delayIndex = rundownMetadata.flatEntryOrder.indexOf(delay.id);

  // if the delay is empty, or the last element
  // there is nothing do apply
  if (delay.duration === 0 || delayIndex === rundown.order.length - 1) {
    return;
  }

  /**
   * We iterate through the rundown and apply the delay
   * The delay values becomes part of the event schedule
   * The delay is applied as if the rundown was flat
   */
  let delayValue = delay.duration;
  let lastEntry: OntimeEvent | null = null;
  let isFirstEvent = true;

  for (let i = delayIndex + 1; i < rundownMetadata.flatEntryOrder.length; i++) {
    const currentId = rundownMetadata.flatEntryOrder[i];
    const currentEntry = rundown.entries[currentId];

    // we don't do operation on other event types
    if (!isOntimeEvent(currentEntry)) {
      continue;
    }

    // we need to remove the link in the first event to maintain the gap
    let shouldUnlink = isFirstEvent;
    isFirstEvent = false;

    // if the event is not linked, we try and maintain gaps
    if (lastEntry !== null) {
      // when applying negative delays, we need to unlink the event
      // if the previous event was fully consumed by the delay
      if (currentEntry.linkStart && delayValue < 0 && lastEntry.timeStart + delayValue < 0) {
        shouldUnlink = true;
      }

      if (currentEntry.gap > 0) {
        delayValue = Math.max(delayValue - currentEntry.gap, 0);
      }

      if (delayValue === 0) {
        // we can bail from continuing if there are no further delays to apply
        break;
      }
    }

    // save the current entry before making mutations on its values
    lastEntry = { ...currentEntry };

    if (shouldUnlink) {
      currentEntry.linkStart = false;
      shouldUnlink = false;
    }

    // event times move up by the delay value
    // we dont update the delay value since we would need to iterate through the entire dataset
    // this is handled by the rundownCache.generate function
    currentEntry.timeStart = Math.max(0, currentEntry.timeStart + delayValue);
    currentEntry.timeEnd = Math.max(currentEntry.duration, currentEntry.timeEnd + delayValue);
    currentEntry.revision += 1;
  }
}

/**
 * Swaps the data between two events
 * The schedule and metadata are preserved
 * TODO: this logic is for now duplcate of Ontime-Utils.swapEventData
 */
function swap(rundown: Rundown, eventFrom: OntimeEvent, eventTo: OntimeEvent) {
  rundown.entries[eventFrom.id] = {
    ...eventTo,
    // events keep the ID
    id: eventFrom.id,
    // events keep the schedule
    timeStart: eventFrom.timeStart,
    timeEnd: eventFrom.timeEnd,
    duration: eventFrom.duration,
    linkStart: eventFrom.linkStart,
    parent: eventFrom.parent,
    // keep schedule metadata
    delay: eventFrom.delay,
    gap: eventFrom.gap,
    dayOffset: eventFrom.dayOffset,
    // keep revision number but increment it
    revision: eventFrom.revision++,
  };

  rundown.entries[eventTo.id] = {
    ...eventFrom,
    // events keep the ID
    id: eventTo.id,
    // events keep the schedule
    timeStart: eventTo.timeStart,
    timeEnd: eventTo.timeEnd,
    duration: eventTo.duration,
    linkStart: eventTo.linkStart,
    parent: eventTo.parent,
    // keep schedule metadata
    delay: eventTo.delay,
    gap: eventTo.gap,
    dayOffset: eventTo.dayOffset,
    // keep revision number but increment it
    revision: eventTo.revision++,
  };
}

/**
 * Inserts a clone of the given entry into the rundown
 * Handles cloning children if the entry is a block
 */
function clone(rundown: Rundown, entry: OntimeEntry): OntimeEntry {
  if (isOntimeBlock(entry)) {
    const newBlock = cloneBlock(entry, getUniqueId(rundown));
    const nestedIds: EntryId[] = [];

    for (let i = 0; i < entry.events.length; i++) {
      const nestedEntryId = entry.events[i];
      const nestedEntry = rundown.entries[nestedEntryId];
      if (!nestedEntry) {
        continue;
      }

      // clone the event and assign it to the new block
      const newNestedEntry = cloneEntry(nestedEntry, getUniqueId(rundown));
      (newNestedEntry as OntimeEvent | OntimeDelay).parent = newBlock.id;

      nestedIds.push(newNestedEntry.id);
      // we immediately insert the nested entries into the rundown
      rundown.entries[newNestedEntry.id] = newNestedEntry;
    }

    // indexes + 1 since we are inserting after the cloned block
    const atIndex = rundown.order.indexOf(entry.id) + 1;

    newBlock.events = nestedIds;
    newBlock.title = `${entry.title || 'Untitled'} (copy)`;

    rundown.entries[newBlock.id] = newBlock;
    rundown.order = insertAtIndex(atIndex, newBlock.id, rundown.order);

    return newBlock;
  } else {
    return add(rundown, cloneEntry(entry, getUniqueId(rundown)), entry.id, entry.parent);
  }
}

/**
 * Groups a list of entries into a block
 * It ensures that the entries get reassigned parent and the block gets a list of events
 * The block will be created at the index of the first event in the order, not at the lowest index
 * Mutates the given rundown
 */
function group(rundown: Rundown, entryIds: EntryId[]): OntimeBlock {
  const newBlock = createBlock({ id: getUniqueId(rundown) });

  const nestedEvents: EntryId[] = [];
  let firstIndex = -1;
  for (let i = 0; i < entryIds.length; i++) {
    const entryId = entryIds[i];
    const entry = rundown.entries[entryId];
    if (!entry || isOntimeBlock(entry)) {
      // invalid operation, we skip this entry
      continue;
    }

    // the block will be created at the first selected event position
    // note that this is not the lowest index
    if (firstIndex === -1) {
      firstIndex = rundown.flatOrder.indexOf(entryId);
    }

    nestedEvents.push(entryId);
    entry.parent = newBlock.id;
    rundown.flatOrder = rundown.flatOrder.filter((id) => id !== entryId);
    rundown.order = rundown.order.filter((id) => id !== entryId);
  }

  newBlock.events = nestedEvents;
  const insertIndex = Math.max(0, firstIndex);
  // we have filtered the items from the order
  // we will insert them now, with only the block at top level ...
  rundown.order = insertAtIndex(insertIndex, newBlock.id, rundown.order);
  rundown.entries[newBlock.id] = newBlock;

  return newBlock;
}

/**
 * Deletes a block and moves all its children to the top level order
 */
function ungroup(rundown: Rundown, block: OntimeBlock) {
  // get the events from the block and merge them into the order where the block was
  const nestedEvents = block.events;
  const blockIndex = rundown.order.indexOf(block.id);
  rundown.order.splice(blockIndex, 1, ...nestedEvents);

  // delete block from entries and remove its reference from the child events
  delete rundown.entries[block.id];
  for (let i = 0; i < nestedEvents.length; i++) {
    const eventId = nestedEvents[i];
    const entry = rundown.entries[eventId];
    if (!entry) {
      throw new Error('Entry not found');
    }
    (entry as OntimeEvent | OntimeDelay).parent = null;
  }
}

export const rundownMutation = {
  add,
  edit,
  remove,
  removeAll,
  reorder,
  applyDelay,
  swap,
  clone,
  group,
  ungroup,
};

/**
 * Expose function to add an initial rundown to the system
 */
export function init(initialRundown: Readonly<Rundown>, initialCustomFields: Readonly<CustomFields>) {
  const rundown = structuredClone(initialRundown);
  const customFields = structuredClone(initialCustomFields);
  const processedData = processRundown(rundown, customFields);

  // update the cache values
  cachedRundown.id = rundown.id;
  cachedRundown.title = rundown.title;
  projectCustomFields = customFields;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we are not interested in the iteration data
  const { previousEvent, latestEvent, previousEntry, entries, order, ...metadata } = processedData;
  cachedRundown.entries = entries;
  cachedRundown.order = order;
  cachedRundown.flatOrder = metadata.flatEntryOrder; // TODO: remove in favour of the metadata flatEntryOrder
  cachedRundown.revision = rundown.revision;
  rundownMetadata = metadata;

  // defer writing to the database
  setImmediate(async () => {
    await getDataProvider().setRundown(cachedRundown.id, cachedRundown);
  });

  return { rundown, rundownMetadata, customFields, revision: rundown.revision };
}

export const rundownCache = {
  init,
  get: () => {
    return {
      rundown: cachedRundown,
      metadata: rundownMetadata,
      customFields: projectCustomFields,
    };
  },
};

/**
 * Utility updates cache after a mutation
 * Handles calculating the rundown metadata
 * @private should not be called outside of `rundown.dao.ts`, exported for testing
 */
export function processRundown(
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

      // check if the block contains nested entries
      for (let j = 0; j < processedEntry.events.length; j++) {
        const nestedEntryId = processedEntry.events[j];
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
        // if this is not a playable event there is nothing else to do
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
