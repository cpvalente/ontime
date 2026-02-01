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
  isOntimeGroup,
  isOntimeEvent,
  isPlayableEvent,
  OntimeGroup,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  PatchWithId,
  Rundown,
  InsertOptions,
} from 'ontime-types';
import { addToRundown, customFieldLabelToKey, getInsertAfterId, insertAtIndex, createGroup } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { consoleError } from '../../utils/console.js';

import type { RundownMetadata } from './rundown.types.js';
import {
  applyPatchToEntry,
  cloneSimpleRundownEntry,
  deleteById,
  doesInvalidateMetadata,
  getUniqueId,
  makeDeepClone,
} from './rundown.utils.js';
import { makeRundownMetadata, ProcessedRundownMetadata } from './rundown.parser.js';

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
  rundownMetadata: Readonly<RundownMetadata>;

  commit: (shouldProcess?: boolean) => {
    rundown: Readonly<Rundown>;
    rundownMetadata: Readonly<RundownMetadata>;
    customFields: Readonly<CustomFields>;
    revision: Readonly<number>;
  };
};

type TransactionOptions = {
  mutableRundown?: boolean;
  mutableCustomFields?: boolean;
};

export function createTransaction(options: TransactionOptions): Transaction {
  const rundown = options.mutableRundown ? structuredClone(cachedRundown) : cachedRundown;
  const customFields = options.mutableCustomFields ? structuredClone(projectCustomFields) : projectCustomFields;

  /**
   * Applies a mutated rundown to the cache
   * @param shouldProcess - whether the rundown should be processed after the commit
   *                        Some edit mutations, and custom field changes do not require processing
   */
  function commit(shouldProcess: boolean = true) {
    // if the rundown is mutable we persist the changes
    if (options.mutableRundown) {
      // update fields which are agnostic of whether the rundown is processed
      cachedRundown.revision = cachedRundown.revision + 1;
      cachedRundown.title = rundown.title;

      if (!shouldProcess) {
        // if we dont need to process, we just reassign the commit data to the cache
        cachedRundown.entries = rundown.entries;
        cachedRundown.order = rundown.order;
        cachedRundown.flatOrder = rundown.flatOrder;
      } else {
        const processedData = processRundown(rundown, projectCustomFields);
        // update the cache values
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- we are not interested in the iteration data
        const { previousEvent, latestEvent, previousEntry, entries, order, ...metadata } = processedData;

        cachedRundown.entries = entries;
        cachedRundown.order = order;
        cachedRundown.flatOrder = metadata.flatEntryOrder;
        rundownMetadata = metadata;
      }

      // persist after all mutations are applied
      getDataProvider().setRundown(cachedRundown.id, cachedRundown);
    }

    // if the customFields are mutable we persist the changes
    if (options.mutableCustomFields) {
      projectCustomFields = customFields;

      // persist after reassignment
      getDataProvider().setCustomFields(projectCustomFields);
    }

    return {
      rundown: cachedRundown,
      rundownMetadata,
      customFields: projectCustomFields,
      revision: cachedRundown.revision,
    };
  }

  return {
    customFields,
    rundown,
    rundownMetadata,
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
  const delayIndex = rundownMetadata.flatEntryOrder.indexOf(delay.id);

  // if the delay is empty, or the last element
  // there is nothing do apply
  if (delay.duration === 0 || delayIndex === rundownMetadata.flatEntryOrder.length - 1) {
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
  const processedData = processRundown(rundown, customFields);

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
 * Utility updates cache after a mutation
 * Handles calculating the rundown metadata
 * @private should not be called outside of `rundown.dao.ts`, exported for testing
 */
export function processRundown(
  initialRundown: Readonly<Rundown>,
  customFields: Readonly<CustomFields>,
): ProcessedRundownMetadata {
  const { process, getMetadata } = makeRundownMetadata(customFields);

  for (let i = 0; i < initialRundown.order.length; i++) {
    // we assign a reference to the current entry, this will be mutated in place
    const currentEntryId = initialRundown.order[i];
    const currentEntry = initialRundown.entries[currentEntryId];
    if (!currentEntry) {
      continue;
    }
    const { processedEntry } = process(currentEntry, null);

    // if the event is a group, we process the nested entries
    // the code here is a copy of the processing of top level events
    if (isOntimeGroup(processedEntry)) {
      let groupStartTime = null;
      let groupEndTime = null;
      let isFirstLinked = false;
      const groupEvents: EntryId[] = [];
      processedEntry.duration = 0;

      // check if the group contains nested entries
      for (let j = 0; j < processedEntry.entries.length; j++) {
        const nestedEntryId = processedEntry.entries[j];
        const nestedEntry = initialRundown.entries[nestedEntryId];

        if (!nestedEntry) {
          continue;
        }

        groupEvents.push(nestedEntry.id);
        const { processedEntry: processedNestedEntry } = process(nestedEntry, processedEntry.id);

        // we dont extract metadata of skipped events,
        // if this is not a playable event there is nothing else to do
        if (!isOntimeEvent(processedNestedEntry) || !isPlayableEvent(processedNestedEntry)) {
          continue;
        }

        // first start is always the first event
        if (groupStartTime === null) {
          groupStartTime = processedNestedEntry.timeStart;
          isFirstLinked = Boolean(processedNestedEntry.linkStart);
        }

        // lastEntry is the event with the latest end time
        groupEndTime = processedNestedEntry.timeEnd;
        if (j > 0) {
          processedEntry.duration += processedNestedEntry.gap;
        }
        processedEntry.duration = processedEntry.duration + processedNestedEntry.duration;
      }

      // update group metadata
      processedEntry.timeStart = groupStartTime;
      processedEntry.timeEnd = groupEndTime;
      processedEntry.isFirstLinked = isFirstLinked;
      processedEntry.entries = groupEvents;
    }
  }

  return getMetadata();
}
