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
  OntimeEntry,
  PatchWithId,
  Rundown,
} from 'ontime-types';
import { insertAtIndex } from 'ontime-utils';

import { makeRundownMetadata, ProcessedRundownMetadata } from '../../services/rundown-service/rundownCache.utils.js';
import { customFieldChangelog } from '../../services/rundown-service/rundownCache.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

import type { RundownMetadata } from './rundown.types.js';
import { applyPatchToEntry, doesInvalidateMetadata } from './rundown.utils.js';

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

export function getCurrentRundown(): Readonly<Rundown> {
  return cachedRundown;
}

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

export const rundownMutation = {
  add,
  edit,
};

/**
 * Expose function to add an initial rundown to the system
 */
export function init(initialRundown: Readonly<Rundown>, initialCustomFields: Readonly<CustomFields>) {
  const rundown = structuredClone(initialRundown);
  const customFields = structuredClone(initialCustomFields);
  const processedData = processRundown(rundown, customFields);

  const revision = rundown.revision + 1;

  // update the cache values
  cachedRundown.id = rundown.id;
  cachedRundown.title = rundown.title;
  projectCustomFields = customFields;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we are not interested in the iteration data
  const { previousEvent, latestEvent, previousEntry, entries, order, ...metadata } = processedData;
  cachedRundown.entries = entries;
  cachedRundown.order = order;
  cachedRundown.flatOrder = metadata.flatEntryOrder; // TODO: remove in favour of the metadata flatEntryOrder
  cachedRundown.revision = revision;
  rundownMetadata = metadata;

  // defer writing to the database
  setImmediate(async () => {
    await getDataProvider().setRundown(cachedRundown.id, cachedRundown);
  });

  return { rundown, rundownMetadata, customFields, revision };
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
 * @private should not be called outside of `rundownCache.ts`, exported for testing
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
