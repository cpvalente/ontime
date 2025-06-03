import {
  CustomFields,
  EntryId,
  EventPostPayload,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeEntry,
  PatchWithId,
  Rundown,
} from 'ontime-types';

import { getPreviousId } from '../../services/rundown-service/rundownUtils.js';
import { updateRundownData } from '../../stores/runtimeState.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { runtimeService } from '../../services/runtime-service/RuntimeService.js';

import { createTransaction, rundownCache, rundownMutation } from './rundown.dao.js';
import { RundownMetadata } from './rundown.types.js';
import { generateEvent, hasChanges } from './rundown.utils.js';

/**
 * creates a new entry with given data
 */
export async function addEntry(eventData: EventPostPayload): Promise<OntimeEntry> {
  const { rundown, commit } = createTransaction();

  // we allow the user to provide an ID, but make sure it is unique
  if (eventData?.id && Object.hasOwn(rundown.entries, eventData.id)) {
    throw new Error(`Event with ID ${eventData.id} already exists`);
  }

  // if the user provides a parent (inside a group), we make sure it exists and it is a group
  let parent: EntryId | null = null;
  if ('parent' in eventData && eventData.parent != null) {
    const maybeParent = rundown.entries[eventData.parent];
    if (!maybeParent || !isOntimeBlock(maybeParent)) {
      throw new Error(`Invalid parent event with ID ${eventData.parent}`);
    }
    parent = eventData.parent;
  }

  // normalise the position of the event in the rundown order
  const afterId = getPreviousId(rundown, eventData?.after, eventData?.before);

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
  const { rundown, commit } = createTransaction();
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

  // we dont allow the user to change the cue to empty string
  if (isOntimeEvent(patch) && patch?.cue === '') {
    throw new Error('Cue value invalid');
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
    notifyChanges(rundownMetadata, revision, { timer: [entry.id], external: true });
  });

  return entry;
}

/**
 * Applies a patch to several entries in the rundown
 */
export async function batchEditEntries(ids: EntryId[], patch: Partial<OntimeEntry>): Promise<Rundown> {
  const { rundown, commit } = createTransaction();

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
    notifyChanges(rundownMetadata, revision, { timer: changedIds, external: true });
  });

  return rundownResult;
}

/**
 * Deletes a known entry from the current rundown
 */
export async function deleteEntries(entryIds: EntryId[]): Promise<Rundown> {
  const { rundown, commit } = createTransaction();

  for (let i = 0; i < entryIds.length; i++) {
    const entry = rundown.entries[entryIds[i]];
    if (!entry) {
      continue;
    }
    rundownMutation.remove(rundown, entryIds[i]);
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
  const { rundown, commit } = createTransaction();

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
 * Handles moving across root orders (a block order and top level order)
 * @throws if entryId or destinationId not found
 */
export function reorderEntry(entryId: EntryId, destinationId: EntryId, order: 'before' | 'after' | 'insert') {
  const { rundown, commit } = createTransaction();

  // check that both entries exist
  const eventFrom = rundown.entries[entryId];
  const eventTo = rundown.entries[destinationId];

  if (!eventFrom || !eventTo) {
    throw new Error('Event not found');
  }

  rundownMutation.reorder(rundown, entryId, destinationId, order);

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
  const { rundown, commit } = createTransaction();

  // check that delay exists
  if (!rundown.entries[delayId] || !isOntimeDelay(rundown.entries[delayId])) {
    throw new Error('Given delay ID not found');
  }

  // apply the delay and delete the it
  rundownMutation.applyDelay(rundown, delayId);
  rundownMutation.remove(rundown, delayId);

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
  const { rundown, commit } = createTransaction();
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
  const { rundown, commit } = createTransaction();
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
    if (isOntimeBlock(newEntry)) {
      notifyChanges(rundownMetadata, revision, { timer: newEntry.events, external: true });
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
 *
 * @private - exported for testing
 */
export function notifyChanges(rundownMetadata: RundownMetadata, revision: number, options: NotifyChangesOptions) {
  // notify timer service of changed events
  if (options.timer) {
    // all events were deleted
    if (rundownMetadata.playableEventOrder.length === 0) {
      runtimeService.stop();
    } else {
      /**
       * Timer can be
       * - true: all events changed
       * - an array of changed IDs
       * - undefined: filtered above, no notification intended
       */
      // timer can be true or an array of changed IDs
      const affected = Array.isArray(options.timer) ? options.timer : undefined;
      runtimeService.notifyOfChangedEvents(affected);
    }
  }

  // notify external services of changes
  if (options.external) {
    const payload = {
      target: 'RUNDOWN',
      reload: options.reload,
      revision,
    };
    sendRefetch(payload);
  }
}

/**
 * Sets a new rundown in the cache
 * and marks it as the currently loaded one
 */
export async function initRundown(rundown: Readonly<Rundown>, customFields: Readonly<CustomFields>) {
  const { rundownMetadata, revision } = rundownCache.init(rundown, customFields);

  // notify runtime that rundown has changed
  updateRuntimeOnChange(rundownMetadata);

  // notify timer of change
  notifyChanges(rundownMetadata, revision, { timer: true, external: true, reload: true });
}
