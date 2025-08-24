import {
  CustomField,
  CustomFieldKey,
  CustomFields,
  EntryId,
  EventPostPayload,
  isOntimeGroup,
  isOntimeDelay,
  isOntimeEvent,
  OntimeGroup,
  OntimeEntry,
  PatchWithId,
  RefetchKey,
  Rundown,
  LogOrigin,
} from 'ontime-types';
import { customFieldLabelToKey } from 'ontime-utils';

import { updateRundownData } from '../../stores/runtimeState.js';
import { runtimeService } from '../../services/runtime-service/runtime.service.js';

import { createTransaction, customFieldMutation, rundownCache, rundownMutation } from './rundown.dao.js';
import type { RundownMetadata } from './rundown.types.js';
import { generateEvent, getInsertAfterId, hasChanges } from './rundown.utils.js';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { setLastLoadedRundown } from '../../services/app-state-service/AppStateService.js';
import { logger } from '../../classes/Logger.js';

/**
 * creates a new entry with given data
 */
export async function addEntry(eventData: EventPostPayload): Promise<OntimeEntry> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });

  // we allow the user to provide an ID, but make sure it is unique
  if (eventData?.id && Object.hasOwn(rundown.entries, eventData.id)) {
    throw new Error(`Event with ID ${eventData.id} already exists`);
  }

  // the parent can be provided or inferred from position
  let parent: OntimeGroup | null = null;

  if ('parent' in eventData && eventData.parent != null) {
    // if the user provides a parent (inside a group), we make sure it exists and it is a group
    const maybeParent = rundown.entries[eventData.parent];
    if (!maybeParent || !isOntimeGroup(maybeParent)) {
      throw new Error(`Invalid parent event with ID ${eventData.parent}`);
    }
    parent = maybeParent;
  } else {
    // otherwise, we may infer the parent from relative positioning (after/before)
    const referenceId = eventData?.after ?? eventData?.before;
    if (referenceId) {
      const maybeSibling = rundown.entries[referenceId];
      if (maybeSibling && 'parent' in maybeSibling && maybeSibling.parent) {
        const maybeParent = rundown.entries[maybeSibling.parent];
        if (maybeParent && isOntimeGroup(maybeParent)) {
          parent = maybeParent;
        }
      }
    }
  }

  // normalise the position of the event in the rundown order
  const afterId = getInsertAfterId(rundown, parent, eventData?.after, eventData?.before);

  // generate a fully formed entry from the patch
  const newEntry = generateEvent(rundown, eventData, afterId);

  // make mutations to rundown
  rundownMutation.add(rundown, newEntry, afterId, parent);

  const { rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundownMetadata, revision, { timer: [newEntry.id], external: true });
  });

  return newEntry;
}

/**
 * Applies a patch to an entry in the rundown
 */
export async function editEntry(patch: PatchWithId): Promise<OntimeEntry> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });
  const currentEntry = rundown.entries[patch.id];

  /**
   * We validate the patch before applying it
   * - disallow edit an entry that does not exist
   * - disallow setting the cue to empty string
   * - disallow change the type of an entry
   */

  // could the entry have been deleted?
  if (!currentEntry) {
    throw new Error('Entry not found');
  }

  // we cannot allow patching to a different type
  if (patch?.type && currentEntry.type !== patch.type) {
    throw new Error('Invalid event type');
  }

  // if nothing changed, nothing to do
  if (!hasChanges(currentEntry, patch)) {
    return currentEntry;
  }

  const { entry, didInvalidate } = rundownMutation.edit(rundown, patch);
  const { rundownMetadata, revision } = commit(didInvalidate);

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundownMetadata, revision, { timer: didInvalidate ? true : [entry.id], external: true });
  });

  return entry;
}

/**
 * Applies a patch to several entries in the rundown
 */
export async function batchEditEntries(ids: EntryId[], patch: Partial<OntimeEntry>): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });

  /**
   * We can do some validation globally, but mostly we will validate each entry individually
   * - disallow setting the cue to empty string
   */
  if ('cue' in patch && patch.cue === '') {
    throw new Error('Cue value invalid');
  }

  let batchDidInvalidate = false;
  const changedIds: EntryId[] = [];
  const patchedEntries: OntimeEntry[] = [];
  for (let i = 0; i < ids.length; i++) {
    const currentId = ids[i];
    const currentEntry = rundown.entries[currentId];
    /**
     * Most of the validation needs to be done in regard to the change
     * - cannot edit an entry that does not exist
     * - disallow change the type of an entry
     * - disallow change the ID of an entry
     */
    // could the entry have been deleted?
    if (!currentEntry) {
      continue;
    }

    // we cannot allow patching to a different type
    if (patch?.type && currentEntry.type !== patch.type) {
      throw new Error('Invalid event type');
    }

    // if nothing changed, nothing to do
    if (!hasChanges(currentEntry, patch)) {
      continue;
    }

    const { entry, didInvalidate } = rundownMutation.edit(rundown, { ...patch, id: currentId });

    changedIds.push(currentId);
    patchedEntries.push(entry);

    if (didInvalidate) {
      batchDidInvalidate = true;
    }
  }
  const { rundown: rundownResult, rundownMetadata, revision } = commit(batchDidInvalidate);

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundownMetadata, revision, { timer: batchDidInvalidate ? true : changedIds, external: true });
  });

  return rundownResult;
}

/**
 * Deletes a known entry from the current rundown
 */
export async function deleteEntries(entryIds: EntryId[]): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });

  for (let i = 0; i < entryIds.length; i++) {
    const entry = rundown.entries[entryIds[i]];
    if (!entry) {
      continue;
    }
    rundownMutation.remove(rundown, entry);
  }

  const { rundown: rundownResult, rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundownMetadata, revision, { timer: entryIds, external: true });
  });

  return rundownResult;
}

/**
 * Deletes all entries from the current rundown
 */
export async function deleteAllEntries(): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });

  rundownMutation.removeAll(rundown);

  const { rundown: rundownResult, rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * Moves an event to a new position in the rundown
 * Handles moving across root orders (a group order and top level order)
 * @throws if entryId or destinationId not found
 */
export async function reorderEntry(entryId: EntryId, destinationId: EntryId, order: 'before' | 'after' | 'insert') {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });

  // check that both entries exist
  const eventFrom = rundown.entries[entryId];
  const eventTo = rundown.entries[destinationId];

  if (!eventFrom || !eventTo) {
    throw new Error('Event not found');
  }

  rundownMutation.reorder(rundown, eventFrom, eventTo, order);

  const { rundown: rundownResult, rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * Applies a delay into the rundown effectively changing the schedule
 * The applied delay is deleted
 */
export async function applyDelay(delayId: EntryId): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });

  // check that delay exists
  const delay = rundown.entries[delayId];
  if (!delay || !isOntimeDelay(delay)) {
    throw new Error('Given delay ID not found');
  }

  // apply the delay and delete the it
  rundownMutation.applyDelay(rundown, delay);
  rundownMutation.remove(rundown, delay);

  const { rundown: rundownResult, rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * Swaps the data between two events in the rundown
 */
export async function swapEvents(fromId: EntryId, toId: EntryId): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });
  const eventFrom = rundown.entries[fromId];
  const eventTo = rundown.entries[toId];

  // check that both entries exist
  if (!eventFrom || !eventTo) {
    throw new Error('Event not found');
  }

  // we can only swap events
  if (!isOntimeEvent(eventFrom) || !isOntimeEvent(eventTo)) {
    throw new Error('Both entries must be events');
  }

  rundownMutation.swap(rundown, eventFrom, eventTo);
  const { rundown: rundownResult, rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * Clones an entry, ensuring that all dependencies are preserved
 * @throws if the entry to clone does not exist
 */
export async function cloneEntry(entryId: EntryId): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });
  const originalEntry = rundown.entries[entryId];

  if (!originalEntry) {
    throw new Error('Did not find event to clone');
  }

  const newEntry = rundownMutation.clone(rundown, originalEntry);
  const { rundown: rundownResult, rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    if (isOntimeGroup(newEntry)) {
      notifyChanges(rundownMetadata, revision, { timer: newEntry.entries, external: true });
    } else if (isOntimeEvent(newEntry)) {
      notifyChanges(rundownMetadata, revision, { timer: [newEntry.id], external: true });
    } else if (isOntimeDelay(newEntry)) {
      notifyChanges(rundownMetadata, revision, { external: true });
    }
    notifyChanges(rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * Groups a list of entries into a new group
 */
export async function groupEntries(entryIds: EntryId[]): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });

  rundownMutation.group(rundown, entryIds);
  const { rundown: rundownResult, rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // we need to notify the timer since we might be grouping a running event
    notifyChanges(rundownMetadata, revision, { external: true, timer: true });
  });

  return rundownResult;
}

/**
 * Deletes a group and moves all its children to the top level
 */
export async function ungroupEntries(groupId: EntryId): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: false });

  const group = rundown.entries[groupId];
  if (!group || !isOntimeGroup(group)) {
    throw new Error(`Group with ID ${groupId} not found or is not a group`);
  }

  rundownMutation.ungroup(rundown, group);
  const { rundown: rundownResult, rundownMetadata, revision } = commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // we dont need to notify the timer since the grouping does not affect the runtime
    notifyChanges(rundownMetadata, revision, { external: true });
  });

  return rundownResult;
}

/**
 * Adds a new custom field to the project
 * @throws if the label is missing or invalid
 */
export async function createCustomField(customField: CustomField): Promise<CustomFields> {
  const key = customFieldLabelToKey(customField.label);

  if (!key) {
    throw new Error('Unable to convert label to a valid key');
  }

  const { customFields, commit } = createTransaction({ mutableRundown: false, mutableCustomFields: true });

  // check if label already exists
  if (Object.hasOwn(customFields, key)) {
    throw new Error('Label already exists');
  }

  customFieldMutation.add(customFields, key, customField);

  // Adding a custom field has no immediate implications on the rundown
  const { customFields: resultCustomFields } = commit(false);

  setImmediate(() => {
    sendRefetch(RefetchKey.CustomFields);
  });

  return resultCustomFields;
}

/**
 * Edits an existing custom field
 * In practice users can only change the label and the colour of the field
 * @throws if the field does not exist
 * @throws if the field type is changed
 * @throws if the label is missing or invalid
 * @throws if the new label already exists
 */
export async function editCustomField(key: CustomFieldKey, newField: Partial<CustomField>): Promise<CustomFields> {
  const { customFields, customFieldsMetadata, rundown, commit } = createTransaction({
    mutableRundown: true,
    mutableCustomFields: true,
  });

  if (!(key in customFields)) {
    throw new Error('Could not find label');
  }

  const existingField = customFields[key];
  // if user provides a type, it must be the same from before
  if (newField.type && existingField.type !== newField.type) {
    throw new Error('Change of field type is not allowed');
  }

  const { oldKey, newKey } = customFieldMutation.edit(customFields, key, existingField, newField);

  // if key has changed
  if (oldKey !== newKey) {
    // 1. delete the old key
    customFieldMutation.remove(customFields, oldKey);
    if (oldKey in customFieldsMetadata.assigned) {
      // 2. reassign references
      customFieldMutation.renameUsages(rundown, customFieldsMetadata.assigned, oldKey, newKey);
    }
  }

  // the custom fields have been removed and there is no processing to be done
  const { rundownMetadata, revision, customFields: resultCustomFields } = commit(false);

  // schedule the side effects
  setImmediate(() => {
    notifyChanges(rundownMetadata, revision, { timer: true, external: true });
  });

  return resultCustomFields;
}

/**
 * Deletes an existing custom field
 */
export async function deleteCustomField(key: CustomFieldKey): Promise<CustomFields> {
  const { customFields, customFieldsMetadata, rundown, commit } = createTransaction({
    mutableRundown: true,
    mutableCustomFields: true,
  });
  if (!(key in customFields)) {
    return customFields;
  }

  customFieldMutation.remove(customFields, key);
  if (key in customFieldsMetadata.assigned) {
    customFieldMutation.removeUsages(rundown, customFieldsMetadata.assigned, key);
  }

  // the custom fields have been removed and there is no processing to be done
  const { rundownMetadata, revision, customFields: resultCustomFields } = commit(false);

  // schedule the side effects
  setImmediate(() => {
    notifyChanges(rundownMetadata, revision, { timer: true, external: true });
  });

  return resultCustomFields;
}

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 *
 * @private - exported for testing
 */
export function updateRuntimeOnChange(rundownMetadata: RundownMetadata) {
  // we only declare the amount of playable events
  const numEvents = rundownMetadata.timedEventOrder.length;

  // schedule an update for the end of the event loop
  updateRundownData({
    numEvents,
    ...rundownMetadata,
  });
}

type NotifyChangesOptions = {
  timer?: boolean | string[]; // whether to notify the timer, could be a yes / no or an array of affected IDs
  external?: boolean; // whether to notify external services
  reload?: boolean; // major change, clients should consider refetching everything
};

/**
 * Notify services of changes in the rundown
 */
function notifyChanges(rundownMetadata: RundownMetadata, revision: number, options: NotifyChangesOptions) {
  // notify timer service of changed events
  if (options.timer) {
    runtimeService.notifyOfChangedEvents(rundownMetadata);
  }

  // notify external services of changes
  if (options.reload) {
    sendRefetch(RefetchKey.All);
  } else if (options.external) {
    sendRefetch(RefetchKey.Rundown, revision);
  }
}

/**
 * Sets a new rundown in the cache
 * and marks it as the currently loaded one
 */
export async function initRundown(
  rundown: Readonly<Rundown>,
  customFields: Readonly<CustomFields>,
  reload: boolean = false,
) {
  const { rundownMetadata, revision } = rundownCache.init(rundown, customFields);
  logger.info(LogOrigin.Server, `Switch to rundown: ${rundown.id}`);
  // notify runtime that rundown has changed
  updateRuntimeOnChange(rundownMetadata);

  setImmediate(() => {
    notifyChanges(rundownMetadata, revision, { timer: true, external: true, reload });
    setLastLoadedRundown(rundown.id).catch((error) => {
      logger.error(LogOrigin.Server, `Failed to persist last loaded rundown: ${error}`);
    });
  });
}
