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
  CustomField,
  CustomFieldKey,
  CustomFields,
  EntryId,
  InsertOptions,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  PatchWithId,
  Rundown,
  isOntimeEvent,
  isOntimeGroup,
  isPlayableEvent,
} from 'ontime-types';
import { addToRundown, createGroup, customFieldLabelToKey, getInsertAfterId, insertAtIndex } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { consoleError } from '../../utils/console.js';
import { ProcessedRundownMetadata, makeRundownMetadata } from './rundown.parser.js';
import type { RundownMetadata } from './rundown.types.js';
import {
  applyPatchToEntry,
  cloneSimpleRundownEntry,
  deleteById,
  doesInvalidateMetadata,
  getUniqueId,
  makeDeepClone,
} from './rundown.utils.js';

/**
 * The currently loaded rundown in cache
 */
const cachedRundown: Rundown = {
  id: '',
  title: '',
  order: [],
  flatOrder: [],
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
  flags: [],
};

/**
 * The custom fields that are used in the project
 * Not unique to the loaded rundown
 */
let projectCustomFields: CustomFields = {};

export const getCurrentRundown = (): Readonly<Rundown> => cachedRundown;
export const getRundownMetadata = (): Readonly<RundownMetadata> => rundownMetadata;
export const getProjectCustomFields = (): Readonly<CustomFields> => projectCustomFields;
export const getEntryWithId = (entryId: EntryId): OntimeEntry | undefined => cachedRundown.entries[entryId];

type Transaction = {
  customFields: CustomFields;
  rundown: Rundown;

  commit: (shouldProcess?: boolean) => Promise<{
    rundown: Readonly<Rundown>;
    rundownMetadata: Readonly<RundownMetadata> | null;
    customFields: Readonly<CustomFields>;
    revision: Readonly<number>;
  }>;
};

type TransactionOptions = {
  mutableRundown?: boolean;
  mutableCustomFields?: boolean;
  /**
   * Target rundown ID. Defaults to the loaded rundown.
   * When targeting a non-loaded ("background") rundown, the cache and runtime
   * metadata are bypassed — the rundown is read from disk and persisted directly.
   */
  rundownId?: string;
};

export function createTransaction(options: TransactionOptions): Transaction {
  const targetId = options.rundownId ?? cachedRundown.id;
  const isLoaded = targetId === cachedRundown.id;
  const sourceRundown: Rundown = isLoaded ? cachedRundown : (getDataProvider().getRundown(targetId) as Rundown);
  const rundown = options.mutableRundown ? structuredClone(sourceRundown) : sourceRundown;
  const customFields = options.mutableCustomFields ? structuredClone(projectCustomFields) : projectCustomFields;

  /**
   * Applies a mutated rundown to its persistence target
   * @param shouldProcess - whether the rundown should be processed after the commit
   *                        Some edit mutations, and custom field changes do not require processing
   */
  async function commit(shouldProcess: boolean = true) {
    let committedRundown: Readonly<Rundown> = isLoaded ? cachedRundown : rundown;
    let committedMetadata: RundownMetadata | null = isLoaded ? rundownMetadata : null;
    let committedRevision: number = sourceRundown.revision;

    // if the rundown is mutable we persist the changes
    if (options.mutableRundown) {
      if (isLoaded) {
        // update fields which are agnostic of whether the rundown is processed
        cachedRundown.revision = cachedRundown.revision + 1;
        cachedRundown.title = rundown.title;

        if (!shouldProcess) {
          // if we dont need to process, we just reassign the commit data to the cache
          cachedRundown.entries = rundown.entries;
          cachedRundown.order = rundown.order;
          cachedRundown.flatOrder = rundown.flatOrder;
        } else {
          const processedData = processRundown(rundown, projectCustomFields, { mutate: true });
          // update the cache values
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we are not interested in the iteration data
          const { previousEvent, latestEvent, previousEntry, entries, order, ...metadata } = processedData;

          cachedRundown.entries = entries;
          cachedRundown.order = order;
          cachedRundown.flatOrder = metadata.flatEntryOrder;
          rundownMetadata = metadata;
        }

        // persist after all mutations are applied
        await getDataProvider().setRundown(cachedRundown.id, cachedRundown);
        committedRundown = cachedRundown;
        committedMetadata = rundownMetadata;
        committedRevision = cachedRundown.revision;
      } else {
        // background rundown: process if requested, persist directly, no runtime metadata
        rundown.revision = rundown.revision + 1;
        if (shouldProcess) {
          const processedData = processRundown(rundown, projectCustomFields, { mutate: true });
          rundown.entries = processedData.entries;
          rundown.order = processedData.order;
          rundown.flatOrder = processedData.flatEntryOrder;
        }
        await getDataProvider().setRundown(targetId, rundown);
        committedRundown = rundown;
        committedRevision = rundown.revision;
      }
    }

    // if the customFields are mutable we persist the changes
    if (options.mutableCustomFields) {
      projectCustomFields = customFields;

      // persist after reassignment
      await getDataProvider().setCustomFields(projectCustomFields);
    }

    return {
      rundown: committedRundown,
      rundownMetadata: committedMetadata,
      customFields: projectCustomFields,
      revision: committedRevision,
    };
  }

  return {
    customFields,
    rundown,
    commit,
  };
}

/**
 * Applies a patch of changes to an existing entry
 * @returns { entry: OntimeEntry, didInvalidate: boolean } - didInvalidate indicates whether the change warrants a recalculation of the cache
 */
function edit(rundown: Rundown, patch: PatchWithId): { entry: OntimeEntry; didInvalidate: boolean } {
  const entry = rundown.entries[patch.id];
  if (!entry) {
    throw new Error(`Entry with id ${patch.id} not found`);
  }

  // apply the patch and replace the entry
  const newEntry = applyPatchToEntry(entry, patch);
  rundown.entries[entry.id] = newEntry;

  // check whether the data warrants recalculation of cache
  const didInvalidate = doesInvalidateMetadata(patch);

  return { entry: newEntry, didInvalidate };
}

/**
 * Deletes an entry from the rundown
 * - if the entry is an ontime group, we delete it along with its children
 * - if the entry is inside a group, we delete it and remove the reference from the parent group
 */
function remove(rundown: Rundown, entry: OntimeEntry) {
  if (isOntimeGroup(entry)) {
    // for ontime groups, we need to iterate through the children and delete them
    for (let i = 0; i < entry.entries.length; i++) {
      const nestedEntryId = entry.entries[i];
      deleteEntry(nestedEntryId);
    }
  } else if (entry.parent) {
    // at this point, we are handling entries inside a group, so we need to remove the reference
    const parentGroup = rundown.entries[entry.parent];

    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (parentGroup && !isOntimeGroup(parentGroup)) {
        consoleError(`Parent group with ID ${entry.parent} is not a valid Group`);
      }
    }

    if (parentGroup && isOntimeGroup(parentGroup)) {
      // we call a mutation to the parent event to remove the entry from the events
      const filteredEvents = deleteById(parentGroup.entries, entry.id);
      edit(rundown, { id: parentGroup.id, entries: filteredEvents });
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
 * @param order - 'before' | 'after' | 'insert' - where to add the entry, insert serves to add the entry into an empty group
 * @throws if we insert a group inside another
 */
function reorder(rundown: Rundown, eventFrom: OntimeEntry, eventTo: OntimeEntry, order: 'before' | 'after' | 'insert') {
  // handle moving across parents
  const fromParent: EntryId | null = (eventFrom as { parent?: EntryId })?.parent ?? null;
  const toParent = (() => {
    if (isOntimeGroup(eventTo)) {
      // Special case: if we're moving relative to our own parent group, remove from group
      if ('parent' in eventFrom && eventFrom.parent === eventTo.id) {
        return null;
      }
      if (order === 'insert') {
        // prevent groups from being inserted into other groups
        if (isOntimeGroup(eventFrom)) {
          throw new Error('Cannot insert a group into another group');
        }
        return eventTo.id;
      }
      return null;
    }
    return eventTo.parent ?? null;
  })();

  // always update the parent when moving entries
  if ('parent' in eventFrom) {
    eventFrom.parent = toParent;
  }

  const sourceArray = fromParent === null ? rundown.order : (rundown.entries[fromParent] as OntimeGroup).entries;
  const destinationArray = toParent === null ? rundown.order : (rundown.entries[toParent] as OntimeGroup).entries;

  const fromIndex = sourceArray.indexOf(eventFrom.id);
  const toIndex = (() => {
    const baseIndex = destinationArray.indexOf(eventTo.id);
    if (order === 'before') return baseIndex;
    if (order === 'after') {
      // When moving within the same array, we need to consider the source position
      if (sourceArray === destinationArray && fromIndex <= baseIndex) {
        return baseIndex;
      }
      return baseIndex + 1;
    }
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
  const delayIndex = rundown.flatOrder.indexOf(delay.id);

  // if the delay is empty, or the last element
  // there is nothing do apply
  if (delay.duration === 0 || delayIndex === rundown.flatOrder.length - 1) {
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

  for (let i = delayIndex + 1; i < rundown.flatOrder.length; i++) {
    const currentId = rundown.flatOrder[i];
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
 * TODO: this logic is for now duplicate of Ontime-Utils.swapEventData
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
 * Handles cloning children if the entry is a group
 */
function clone(rundown: Rundown, entry: OntimeEntry, options?: InsertOptions): OntimeEntry {
  if (isOntimeGroup(entry)) {
    const { newGroup, nestedEntries } = makeDeepClone(entry, rundown);

    // insert all entries into the rundown
    rundown.entries[newGroup.id] = newGroup;
    for (let i = 0; i < nestedEntries.length; i++) {
      const nestedEntry = nestedEntries[i];
      rundown.entries[nestedEntry.id] = nestedEntry;
    }

    // by default we insert after the cloned element
    let atIndex = rundown.order.indexOf(entry.id) + 1;

    const referenceId = options?.after ?? options?.before;
    if (referenceId) {
      // trying to insert relatively to another entry
      const referenceEntry = rundown.entries[referenceId];
      if (referenceEntry) {
        if (options?.after) {
          atIndex = rundown.order.indexOf(referenceId) + 1;
        } else if (options?.before) {
          atIndex = rundown.order.indexOf(referenceId);
        }
      }
    }

    // we only need to insert the group, the nested entries will be resolved by the rundown engine
    rundown.order = insertAtIndex(atIndex, newGroup.id, rundown.order);

    return newGroup;
  } else {
    const clonedEntry = cloneSimpleRundownEntry(entry, getUniqueId(rundown));

    let parent: OntimeGroup | null = null;

    // trying to insert relatively to another entry, check that entries parent
    const referenceId = options?.after ?? options?.before;

    /**
     * if we have a positioning reference, and that reference has a parent
     * we need to maintain the same parent for the cloned entry
     */
    if (referenceId) {
      const referenceEntry = rundown.entries[referenceId];

      if (referenceEntry && !isOntimeGroup(referenceEntry)) {
        if (referenceEntry.parent) {
          const maybeParent = rundown.entries[referenceEntry.parent];
          if (maybeParent && isOntimeGroup(maybeParent)) {
            parent = maybeParent;
          }
        }
      }
    } else if (entry.parent) {
      const maybeParent = rundown.entries[entry.parent];
      if (maybeParent && isOntimeGroup(maybeParent)) {
        parent = maybeParent;
      }
    }

    // if we have resolved a parent, we add it to the cloned entry
    let after = getInsertAfterId(rundown, parent, options?.after, options?.before);
    if (!after) {
      after = entry.id;
    }

    return addToRundown(rundown, clonedEntry, after, parent);
  }
}

/**
 * Groups a list of entries
 * It ensures that the entries get reassigned parent and the group gets a list of events
 * The group will be created at the index of the first event in the order, not at the lowest index
 * Mutates the given rundown
 */
function group(rundown: Rundown, entryIds: EntryId[]): OntimeGroup {
  const newGroup = createGroup({ id: getUniqueId(rundown) });

  const nestedEvents: EntryId[] = [];
  let firstIndex = -1;
  for (let i = 0; i < entryIds.length; i++) {
    const entryId = entryIds[i];
    const entry = rundown.entries[entryId];
    if (!entry || isOntimeGroup(entry)) {
      // invalid operation, we skip this entry
      continue;
    }

    // the group will be created at the first selected event position
    // note that this is not the lowest index
    if (firstIndex === -1) {
      firstIndex = rundown.order.indexOf(entryId);
    }

    nestedEvents.push(entryId);
    entry.parent = newGroup.id;
    rundown.flatOrder = rundown.flatOrder.filter((id) => id !== entryId);
    rundown.order = rundown.order.filter((id) => id !== entryId);
  }

  newGroup.entries = nestedEvents;
  const insertIndex = Math.max(0, firstIndex);
  // we have filtered the items from the order
  // we will insert them now, with only the group at top level ...
  rundown.order = insertAtIndex(insertIndex, newGroup.id, rundown.order);
  rundown.entries[newGroup.id] = newGroup;

  return newGroup;
}

/**
 * Deletes a group and moves all its children to the top level order
 */
function ungroup(rundown: Rundown, group: OntimeGroup) {
  // get the events from the group and merge them into the order where the group was
  const nestedEvents = group.entries;
  const groupIndex = rundown.order.indexOf(group.id);
  rundown.order.splice(groupIndex, 1, ...nestedEvents);

  // delete the group from entries and remove its reference from the child events
  delete rundown.entries[group.id];
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
  add: addToRundown,
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
 * Exposes a way to update a rundown which is not active
 */
export async function updateBackgroundRundown(rundownId: string, rundown: Rundown) {
  await getDataProvider().setRundown(rundownId, rundown);
}

/**
 * Reads a rundown from disk and returns it in the processed shape used by clients.
 * Used for non-loaded rundowns — the loaded rundown is served directly from cache.
 */
export function getProcessedRundown(rundownId: string): Rundown {
  const stored = getDataProvider().getRundown(rundownId);
  const processed = processRundown(stored, getDataProvider().getCustomFields());
  return {
    id: stored.id,
    title: stored.title,
    entries: processed.entries,
    order: processed.order,
    flatOrder: processed.flatEntryOrder,
    revision: stored.revision,
  };
}

/**
 * Adds a new custom field to the object and returns it
 */
function customFieldAdd(customFields: CustomFields, key: CustomFieldKey, newCustomField: CustomField): CustomFields {
  customFields[key] = {
    label: newCustomField.label,
    type: newCustomField.type,
    colour: newCustomField.colour,
  };

  return { [key]: newCustomField };
}

/**
 * Edits an existing custom field
 */
function customFieldEdit(
  customFields: CustomFields,
  key: CustomFieldKey,
  existingField: CustomField,
  newField: Partial<CustomField>,
): { oldKey: CustomFieldKey; newKey: CustomFieldKey } {
  // calculate the key in case it has changed
  const newKey = newField?.label ? customFieldLabelToKey(newField.label ?? key) : key;

  // patch the new field and replace the reference in the object
  customFields[newKey] = { ...existingField, ...newField };

  return { oldKey: key, newKey };
}

/**
 * Removes a custom field from the object
 */
function customFieldRemove(customFields: CustomFields, key: CustomFieldKey) {
  delete customFields[key];
}

/**
 * Iterates through all entries of a rundown and renames a custom field
 */
function customFieldRenameUsages(rundown: Rundown, oldKey: CustomFieldKey, newKey: CustomFieldKey) {
  Object.keys(rundown.entries).forEach((entryId) => {
    const entry = rundown.entries[entryId];
    if ('custom' in entry && entry.custom[oldKey]) {
      // copy the data a new key and delete the old key
      entry.custom[newKey] = entry.custom[oldKey];
      delete entry.custom[oldKey];
    }
  });
}

/**
 * Iterates through all entries of a rundown and removes data associated with a custom field
 */
function customFieldRemoveUsages(rundown: Rundown, key: CustomFieldKey) {
  Object.keys(rundown.entries).forEach((entryId) => {
    const entry = rundown.entries[entryId];
    if ('custom' in entry && entry.custom[key]) {
      delete entry.custom[key];
    }
  });
}

export const customFieldMutation = {
  add: customFieldAdd,
  edit: customFieldEdit,
  remove: customFieldRemove,
  renameUsages: customFieldRenameUsages,
  removeUsages: customFieldRemoveUsages,
};

/**
 * Expose function to add an initial rundown to the system
 */
export function init(initialRundown: Readonly<Rundown>, initialCustomFields: Readonly<CustomFields>) {
  const rundown = structuredClone(initialRundown);
  const customFields = structuredClone(initialCustomFields);
  const processedData = processRundown(rundown, customFields, { mutate: true });

  // update the cache values
  cachedRundown.id = rundown.id;
  cachedRundown.title = rundown.title;
  projectCustomFields = customFields;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we are not interested in the iteration data
  const { previousEvent, latestEvent, previousEntry, entries, order, ...metadata } = processedData;
  cachedRundown.entries = entries;
  cachedRundown.order = order;
  cachedRundown.flatOrder = metadata.flatEntryOrder;
  cachedRundown.revision = rundown.revision;
  rundownMetadata = metadata;

  // defer writing to the database
  getDataProvider().setRundown(cachedRundown.id, cachedRundown);

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
 * Computes derived rundown metadata (delays, gaps, group times, ordered lists).
 * By default the input rundown is not mutated — entries are cloned as they are processed.
 * Callers that own a writable rundown can pass `{ mutate: true }` to skip the per-entry clone.
 * @private should not be called outside of `rundown.dao.ts`, exported for testing
 */
export function processRundown(
  initialRundown: Readonly<Rundown>,
  customFields: Readonly<CustomFields>,
  options?: { mutate?: boolean },
): ProcessedRundownMetadata {
  const { process, getMetadata } = makeRundownMetadata(customFields, options);

  for (let i = 0; i < initialRundown.order.length; i++) {
    const currentEntry = initialRundown.entries[initialRundown.order[i]];
    if (!currentEntry) continue;

    const processedEntry = process(currentEntry, null);
    if (!isOntimeGroup(processedEntry)) continue;

    // process nested entries and recompute aggregate group fields
    let groupStartTime: number | null = null;
    let groupEndTime: number | null = null;
    let isFirstLinked = false;
    const groupEvents: EntryId[] = [];
    processedEntry.duration = 0;

    for (let j = 0; j < processedEntry.entries.length; j++) {
      const nestedEntry = initialRundown.entries[processedEntry.entries[j]];
      if (!nestedEntry) continue;

      groupEvents.push(nestedEntry.id);
      const processedNestedEntry = process(nestedEntry, processedEntry.id);

      // skip metadata aggregation for non-playable nested entries
      if (!isOntimeEvent(processedNestedEntry) || !isPlayableEvent(processedNestedEntry)) continue;

      if (groupStartTime === null) {
        groupStartTime = processedNestedEntry.timeStart;
        isFirstLinked = Boolean(processedNestedEntry.linkStart);
      }
      groupEndTime = processedNestedEntry.timeEnd;
      if (j > 0) {
        processedEntry.duration += processedNestedEntry.gap;
      }
      processedEntry.duration += processedNestedEntry.duration;
    }

    processedEntry.timeStart = groupStartTime;
    processedEntry.timeEnd = groupEndTime;
    processedEntry.isFirstLinked = isFirstLinked;
    processedEntry.entries = groupEvents;
  }

  return getMetadata();
}
