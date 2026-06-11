import {
  CustomField,
  CustomFieldKey,
  CustomFields,
  EntryId,
  EventPostPayload,
  InsertOptions,
  LogOrigin,
  OntimeEntry,
  OntimeGroup,
  PatchWithId,
  ProjectRundowns,
  RefetchKey,
  Rundown,
  isOntimeDelay,
  isOntimeEvent,
  isOntimeGroup,
} from 'ontime-types';
import { customFieldLabelToKey, getInsertAfterId, resolveInsertParent } from 'ontime-utils';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { logger } from '../../classes/Logger.js';
import { makeNewRundown } from '../../models/dataModel.js';
import { setLastLoadedRundown } from '../../services/app-state-service/AppStateService.js';
import { runtimeService } from '../../services/runtime-service/runtime.service.js';
import { updateRundownData } from '../../stores/runtimeState.js';
import {
  createTransaction,
  customFieldMutation,
  getCurrentRundownId,
  rundownCache,
  rundownMutation,
  updateBackgroundRundown,
} from './rundown.dao.js';
import type { RundownMetadata } from './rundown.types.js';
import { duplicateRundown, generateEvent, getIntegerAndFraction, hasChanges } from './rundown.utils.js';

/**
 * creates a new entry with given data
 */
export async function addEntry(rundownId: string, eventData: EventPostPayload): Promise<OntimeEntry> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });

  // we allow the user to provide an ID, but make sure it is unique
  if (eventData?.id && Object.hasOwn(rundown.entries, eventData.id)) {
    throw new Error(`Event with ID ${eventData.id} already exists`);
  }

  // resolve the parent, either from the payload or inferred from sibling position
  const parentId = resolveInsertParent(rundown, eventData);
  let parent: OntimeGroup | null = null;
  if (parentId) {
    const maybeParent = rundown.entries[parentId];
    if (!maybeParent || !isOntimeGroup(maybeParent)) {
      throw new Error(`Invalid parent event with ID ${parentId}`);
    }
    parent = maybeParent;
  }

  // normalise the position of the event in the rundown order
  const afterId = getInsertAfterId(rundown, parent, eventData?.after, eventData?.before);

  // generate a fully formed entry from the patch
  const newEntry = generateEvent(rundown, eventData, afterId, parent?.id);

  // make mutations to rundown
  rundownMutation.add(rundown, newEntry, afterId, parent);

  const { rundown: responseRundown, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundown.id, rundownMetadata, revision, { timer: [newEntry.id], external: true });
  });

  return responseRundown.entries[newEntry.id] ?? newEntry;
}

/**
 * Applies a patch to an entry in the rundown
 */
export async function editEntry(rundownId: string, patch: PatchWithId): Promise<OntimeEntry> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });
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
  const { rundown: responseRundown, rundownMetadata, revision } = await commit(didInvalidate);

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundown.id, rundownMetadata, revision, {
      timer: didInvalidate ? true : [entry.id],
      external: true,
    });
  });

  return responseRundown.entries[entry.id] ?? entry;
}

/**
 * Applies a patch to several entries in the rundown
 */
export async function batchEditEntries(
  rundownId: string,
  ids: EntryId[],
  patch: Partial<OntimeEntry>,
): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });

  /**
   * We can do some validation globally, but mostly we will validate each entry individually
   * - disallow setting the cue to empty string
   */
  if ('cue' in patch && patch.cue === '') {
    throw new Error('Cue value invalid');
  }

  let batchDidInvalidate = false;
  const changedIds: EntryId[] = [];

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

    const { didInvalidate } = rundownMutation.edit(rundown, { ...patch, id: currentId });

    changedIds.push(currentId);

    if (didInvalidate) {
      batchDidInvalidate = true;
    }
  }
  const { rundown: rundownResult, rundownMetadata, revision } = await commit(batchDidInvalidate);

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundown.id, rundownMetadata, revision, {
      timer: batchDidInvalidate ? true : changedIds,
      external: true,
    });
  });

  return rundownResult;
}

/**
 * Deletes a known entry from the current rundown
 */
export async function deleteEntries(rundownId: string, entryIds: EntryId[]): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });

  for (let i = 0; i < entryIds.length; i++) {
    const entry = rundown.entries[entryIds[i]];
    if (!entry) {
      continue;
    }
    rundownMutation.remove(rundown, entry);
  }

  const { rundown: rundownResult, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundown.id, rundownMetadata, revision, { timer: entryIds, external: true });
  });

  return rundownResult;
}

/**
 * Deletes all entries from the current rundown
 */
export async function deleteAllEntries(rundownId: string): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });

  rundownMutation.removeAll(rundown);

  const { rundown: rundownResult, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundown.id, rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * Moves an event to a new position in the rundown
 * Handles moving across root orders (a group order and top level order)
 * @throws if entryId or destinationId not found
 */
export async function reorderEntry(
  rundownId: string,
  entryId: EntryId,
  destinationId: EntryId,
  order: 'before' | 'after' | 'insert',
) {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });

  // check that both entries exist
  const eventFrom = rundown.entries[entryId];
  const eventTo = rundown.entries[destinationId];

  if (!eventFrom || !eventTo) {
    throw new Error('Event not found');
  }

  rundownMutation.reorder(rundown, eventFrom, eventTo, order);

  const { rundown: rundownResult, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundown.id, rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * @throws if an id is missing or not an Ontime event
 */
export async function renumberEntries(
  rundownId: string,
  ids: EntryId[],
  prefix: string,
  start: string,
  increment: string,
): Promise<Rundown> {
  const startNumber = getIntegerAndFraction(start);
  const incrementNumber = getIntegerAndFraction(increment);

  // if the prefix doesn't already include a separator or is empty, then insert a separator
  if (prefix !== '' && !prefix.endsWith('-') && !prefix.endsWith(' ')) prefix += ' ';

  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true, mutableCustomFields: false });

  rundownMutation.renumber(rundown, ids, prefix, startNumber, incrementNumber);

  const { rundown: rundownResult, rundownMetadata, revision } = await commit(false);

  setImmediate(() => {
    updateRuntimeOnChange(rundownMetadata);
    notifyChanges(rundown.id, rundownMetadata, revision, { timer: ids, external: true });
  });

  return rundownResult;
}

/**
 * Applies a delay into the rundown effectively changing the schedule
 * The applied delay is deleted
 */
export async function applyDelay(rundownId: string, delayId: EntryId): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });

  // check that delay exists
  const delay = rundown.entries[delayId];
  if (!delay || !isOntimeDelay(delay)) {
    throw new Error('Given delay ID not found');
  }

  // apply the delay and delete the it
  rundownMutation.applyDelay(rundown, delay);
  rundownMutation.remove(rundown, delay);

  const { rundown: rundownResult, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundown.id, rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * Swaps the data between two events in the rundown
 */
export async function swapEvents(rundownId: string, fromId: EntryId, toId: EntryId): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });
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
  const { rundown: rundownResult, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    notifyChanges(rundown.id, rundownMetadata, revision, { timer: true, external: true });
  });

  return rundownResult;
}

/**
 * Clones an entry, ensuring that all dependencies are preserved
 * Handles cloning children if the entry is a group
 * @throws if the entry to clone does not exist
 */
export async function cloneEntry(rundownId: string, entryId: EntryId, options: InsertOptions): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });
  const originalEntry = rundown.entries[entryId];

  if (!originalEntry) {
    throw new Error('Could not find entry to clone');
  }

  const newEntry = rundownMutation.clone(rundown, originalEntry, options);
  const { rundown: rundownResult, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // notify timer and external services of change
    if (isOntimeGroup(newEntry)) {
      notifyChanges(rundown.id, rundownMetadata, revision, { timer: newEntry.entries, external: true });
    } else if (isOntimeEvent(newEntry)) {
      notifyChanges(rundown.id, rundownMetadata, revision, { timer: [newEntry.id], external: true });
    } else if (isOntimeDelay(newEntry)) {
      notifyChanges(rundown.id, rundownMetadata, revision, { external: true });
    }
  });

  return rundownResult;
}

/**
 * Groups a list of entries into a new group
 */
export async function groupEntries(rundownId: string, entryIds: EntryId[]): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });

  rundownMutation.group(rundown, entryIds);
  const { rundown: rundownResult, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // we need to notify the timer since we might be grouping a running event
    notifyChanges(rundown.id, rundownMetadata, revision, { external: true, timer: true });
  });

  return rundownResult;
}

/**
 * Deletes a group and moves all its children to the top level
 */
export async function ungroupEntries(rundownId: string, groupId: EntryId): Promise<Rundown> {
  const { rundown, commit } = createTransaction({ rundownId, mutableRundown: true });

  const group = rundown.entries[groupId];
  if (!group || !isOntimeGroup(group)) {
    throw new Error(`Group with ID ${groupId} not found or is not a group`);
  }

  rundownMutation.ungroup(rundown, group);
  const { rundown: rundownResult, rundownMetadata, revision } = await commit();

  // schedule the side effects
  setImmediate(() => {
    // notify runtime that rundown has changed
    updateRuntimeOnChange(rundownMetadata);

    // we dont need to notify the timer since the grouping does not affect the runtime
    notifyChanges(rundown.id, rundownMetadata, revision, { external: true });
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
  const { customFields: resultCustomFields } = await commit(false);

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
export async function editCustomField(
  key: CustomFieldKey,
  newField: Partial<CustomField>,
  projectRundowns: ProjectRundowns,
): Promise<CustomFields> {
  const { customFields, rundown, commit } = createTransaction({
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

  // if key has changed ...
  if (oldKey !== newKey) {
    // ... reassign references in the active rundown
    customFieldMutation.renameUsages(rundown, oldKey, newKey);

    // ... reassign references in the background rundowns
    for (const rundownId of Object.keys(projectRundowns)) {
      if (rundownId !== rundown.id) {
        const backgroundRundown = structuredClone(projectRundowns[rundownId]);
        customFieldMutation.renameUsages(backgroundRundown, oldKey, newKey);
        await updateBackgroundRundown(rundownId, backgroundRundown);
      }
    }

    // ... delete the old key
    customFieldMutation.remove(customFields, oldKey);
  }

  // the custom fields have been removed and there is no processing to be done
  const { rundownMetadata, revision, customFields: resultCustomFields } = await commit(false);

  // schedule the side effects
  setImmediate(() => {
    sendRefetch(RefetchKey.CustomFields);
    notifyChanges(undefined, rundownMetadata, revision, { timer: true, external: true });
  });

  return resultCustomFields;
}

/**
 * Deletes an existing custom field
 */
export async function deleteCustomField(key: CustomFieldKey, projectRundowns: ProjectRundowns): Promise<CustomFields> {
  const { customFields, rundown, commit } = createTransaction({
    mutableRundown: true,
    mutableCustomFields: true,
  });
  if (!(key in customFields)) {
    return customFields;
  }

  // remove references in the active rundown
  customFieldMutation.removeUsages(rundown, key);

  // remove references in the background rundowns
  for (const rundownId of Object.keys(projectRundowns)) {
    if (rundownId !== rundown.id) {
      const backgroundRundown = structuredClone(projectRundowns[rundownId]);
      customFieldMutation.removeUsages(backgroundRundown, key);
      await updateBackgroundRundown(rundownId, backgroundRundown);
    }
  }

  // delete the old key
  customFieldMutation.remove(customFields, key);

  // the custom fields have been removed and there is no processing to be done
  const { rundownMetadata, revision, customFields: resultCustomFields } = await commit(false);

  // schedule the side effects
  setImmediate(() => {
    sendRefetch(RefetchKey.CustomFields);
    notifyChanges(undefined, rundownMetadata, revision, { timer: true, external: true });
  });

  return resultCustomFields;
}

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 *
 * @private - exported for testing
 */
export function updateRuntimeOnChange(rundownMetadata: RundownMetadata | null) {
  if (!rundownMetadata) return;
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
 * TODO: we could receive a runtime flag to call updateRuntimeOnChange
 * instead of having it in every consumer
 */
function notifyChanges(
  rundownId: string | undefined,
  rundownMetadata: RundownMetadata | null,
  revision: number,
  options: NotifyChangesOptions,
) {
  // notify timer service of changed event
  if (rundownMetadata && options.timer && rundownId && isCurrentRundown(rundownId)) {
    runtimeService.notifyOfChangedEvents(rundownMetadata);
  }

  if (options.reload) {
    sendRefetch(RefetchKey.All);
  } else if (options.external) {
    sendRefetch(RefetchKey.Rundown, revision, rundownId);
  }
}

export function isCurrentRundown(id: string) {
  return id === getCurrentRundownId();
}

/**
 * @throws if the provided id does not exist
 */
export async function loadRundown(id: string) {
  const dataProvider = getDataProvider();
  if (isCurrentRundown(id)) {
    return dataProvider.getProjectRundowns();
  }

  const rundown = dataProvider.getRundown(id);
  const customField = dataProvider.getCustomFields();
  await initRundown(rundown, customField);
  return dataProvider.getProjectRundowns();
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
  runtimeService.stop();
  const { rundownMetadata, revision } = rundownCache.init(rundown, customFields);
  logger.info(LogOrigin.Server, `Switch to rundown: ${rundown.id}`);
  // notify runtime that rundown has changed
  updateRuntimeOnChange(rundownMetadata);

  setImmediate(() => {
    notifyChanges(rundown.id, rundownMetadata, revision, { timer: true, external: true, reload });
    sendRefetch(RefetchKey.ProjectRundowns);
    setLastLoadedRundown(rundown.id).catch((error) => {
      logger.error(LogOrigin.Server, `Failed to persist last loaded rundown: ${error}`);
    });
  });
}

export async function createNewRundown(title: string) {
  const emptyRundown = makeNewRundown();
  emptyRundown.title = title;
  await getDataProvider().setRundown(emptyRundown.id, emptyRundown);

  const projectRundowns = getDataProvider().getProjectRundowns();

  setImmediate(() => {
    sendRefetch(RefetchKey.ProjectRundowns);
  });

  return projectRundowns;
}

/**
 * Renames an existing rundown
 * @throws if the provided id does not exist
 */
export async function renameRundown(id: string, title: string) {
  const dataProvider = getDataProvider();
  const rundown = dataProvider.getRundown(id);

  await dataProvider.setRundown(id, { ...rundown, title });

  /**
   * If loaded we re-init the rundown
   * This is likely over-kill but the simplest way to ensure state consistency
   */
  if (isCurrentRundown(id)) {
    await initRundown(dataProvider.getRundown(id), dataProvider.getCustomFields());
  } else {
    setImmediate(() => {
      sendRefetch(RefetchKey.ProjectRundowns);
    });
  }

  return dataProvider.getProjectRundowns();
}

/**
 * Duplicates an existing rundown without making it the loaded one
 * @throws if the provided id does not exist
 */
export async function duplicateExistingRundown(id: string) {
  const dataProvider = getDataProvider();
  const rundown = dataProvider.getRundown(id);

  const duplicatedRundown = duplicateRundown(rundown, `Copy of ${rundown.title}`);
  await dataProvider.setRundown(duplicatedRundown.id, duplicatedRundown);

  setImmediate(() => {
    sendRefetch(RefetchKey.ProjectRundowns);
  });

  return dataProvider.getProjectRundowns();
}

/**
 * Deletes a rundown
 * @throws if attempting to delete the loaded rundown or the last rundown in the project
 */
export async function deleteRundown(id: string) {
  if (isCurrentRundown(id)) {
    throw new Error('Cannot delete loaded rundown');
  }

  const dataProvider = getDataProvider();
  if (Object.keys(dataProvider.getProjectRundowns()).length <= 1) {
    throw new Error('Cannot delete the last rundown');
  }

  const projectRundowns = await dataProvider.deleteRundown(id);

  setImmediate(() => {
    sendRefetch(RefetchKey.ProjectRundowns);
  });

  return projectRundowns;
}
