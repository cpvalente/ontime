import {
  CustomFields,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeEntry,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  PatchWithId,
  EventPostPayload,
  Rundown,
  EntryId,
} from 'ontime-types';
import { getCueCandidate } from 'ontime-utils';

import { delay as delayDef } from '../../models/eventsDefinition.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { createBlock, createEvent } from '../../api-data/rundown/rundown.utils.js';
import { updateRundownData } from '../../stores/runtimeState.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';

import * as cache from './rundownCache.js';
import { getPreviousId } from './rundownUtils.js';

type CompleteEntry<T> =
  T extends Partial<OntimeEvent>
    ? OntimeEvent
    : T extends Partial<OntimeDelay>
      ? OntimeDelay
      : T extends Partial<OntimeBlock>
        ? OntimeBlock
        : never;

/**
 * Generates a fully formed RundownEntry of the patch type
 */
function generateEvent<T extends Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeBlock>>(
  eventData: T,
  afterId?: string,
): CompleteEntry<T> {
  if (isOntimeEvent(eventData)) {
    const currentRundown = cache.getCurrentRundown();
    return createEvent(
      eventData,
      getCueCandidate(currentRundown.entries, currentRundown.order, afterId),
    ) as CompleteEntry<T>;
  }

  const id = eventData.id || cache.getUniqueId();

  if (isOntimeDelay(eventData)) {
    return { ...delayDef, duration: eventData.duration ?? 0, id } as CompleteEntry<T>;
  }

  // TODO(v4): allow user to provide a larger patch of the block entry
  if (isOntimeBlock(eventData)) {
    return createBlock({ id, title: eventData.title ?? '' }) as CompleteEntry<T>;
  }

  throw new Error('Invalid event type');
}

/**
 * creates a new event with given data
 */
export async function addEvent(eventData: EventPostPayload): Promise<OntimeEntry> {
  // 1. we allow the user to provide an ID, but make sure it is unique
  if (eventData?.id && cache.hasId(eventData.id)) {
    throw new Error(`Event with ID ${eventData.id} already exists`);
  }

  // 2. if the user provides a parent (inside a group), we make sure it exists and it is a group
  let parent: EntryId | null = null;
  if ('parent' in eventData && eventData.parent != null) {
    const maybeParent = cache.getCurrentRundown().entries[eventData.parent];
    if (!maybeParent || !isOntimeBlock(maybeParent)) {
      throw new Error(`Invalid parent event with ID ${eventData.parent}`);
    }
    parent = eventData.parent;
  }

  // 3. if the user provides an after or before ID, we make sure it exists
  if (eventData?.after !== undefined) {
    if (!cache.hasId(eventData.after)) {
      throw new Error(`Event with ID ${eventData.after} not found`);
    }
  }
  if (eventData?.before !== undefined) {
    if (!cache.hasId(eventData.before)) {
      throw new Error(`Event with ID ${eventData.before} not found`);
    }
  }

  const afterId = getPreviousId(eventData?.after, eventData?.before);

  // generate a fully formed entry from the patch
  const sanitisedEntry = generateEvent(eventData, afterId);

  // modify rundown
  const scopedMutation = cache.mutateCache(cache.add);
  const { newEvent } = await scopedMutation({ afterId, parent, entry: sanitisedEntry });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: [sanitisedEntry.id], external: true });

  // we know this mutation returns an OntimeEntry
  return newEvent as OntimeEntry;
}

/**
 * deletes event by its ID
 */
export async function deleteEvent(eventIds: EntryId[]) {
  const scopedMutation = cache.mutateCache(cache.remove);
  const { didMutate, changeList } = await scopedMutation({ eventIds });

  if (!didMutate) {
    return;
  }

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: changeList, external: true });
}

/**
 * deletes all entries in database
 */
export async function deleteAllEntries() {
  const scopedMutation = cache.mutateCache(cache.removeAll);
  await scopedMutation({});

  // notify event loader that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: true, external: true });
}

/**
 * Apply patch to an element in rundown
 * @param patch
 */
export async function editEvent(patch: PatchWithId) {
  if (isOntimeEvent(patch) && patch?.cue === '') {
    throw new Error('Cue value invalid');
  }

  const scopedMutation = cache.mutateCache(cache.edit);
  const { newEvent, didMutate } = await scopedMutation({ patch, eventId: patch.id });

  // short circuit if nothing changed
  if (!didMutate) {
    return newEvent;
  }

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: [patch.id], external: true });

  return newEvent;
}

/**
 * Applies a patch to several elements in a rundown
 * @param ids
 * @param data
 */
export async function batchEditEvents(ids: string[], data: Partial<OntimeEvent>) {
  const scopedMutation = cache.mutateCache(cache.batchEdit);
  await scopedMutation({ patch: data, eventIds: ids });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: ids, external: true });
}

/**
 * reorders a given entry
 * @param {string} eventId - ID of event from, for sanity check
 * @param {number} from - index of event from
 * @param {number} to - index of event to
 */
export async function reorderEntry(eventId: EntryId, from: number, to: number): Promise<Rundown> {
  const scopedMutation = cache.mutateCache(cache.reorder);
  const { changeList, newRundown } = await scopedMutation({ eventId, from, to });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: changeList, external: true });

  return newRundown;
}

/**
 * Applies a delay into the rundown effectively changing the schedule
 * The applied delay is deleted
 * @param delayId
 */
export async function applyDelay(delayId: EntryId) {
  const scopedMutation = cache.mutateCache(cache.applyDelay);
  await scopedMutation({ delayId });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: true, external: true });
}

/**
 * Clones an entry, ensuring that all dependencies are preserved
 */
export async function cloneEntry(entryId: EntryId) {
  const scopedMutation = cache.mutateCache(cache.clone);
  const { newRundown, newEvent } = await scopedMutation({ entryId });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  if (isOntimeBlock(newEvent)) {
    notifyChanges({ timer: newEvent.events, external: true });
  } else if (isOntimeEvent(newEvent)) {
    notifyChanges({ timer: [newEvent.id], external: true });
  } else if (isOntimeDelay(newEvent)) {
    notifyChanges({ external: true });
  }

  return newRundown;
}

/**
 * Deletes a block from the rundown and moves all its children to the top level
 */
export async function dissolveBlock(blockId: EntryId) {
  const scopedMutation = cache.mutateCache(cache.dissolveBlock);
  const { newRundown } = await scopedMutation({ blockId });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // we dont need to modify the timer since the grouping does not affect the runtime
  notifyChanges({ external: true });

  return newRundown;
}

/**
 * Groups a list of entries into a block
 */
export async function groupEntries(entryIds: EntryId[]) {
  const scopedMutation = cache.mutateCache(cache.groupEntries);
  const { newRundown } = await scopedMutation({ entryIds });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // we dont need to modify the timer since the grouping does not affect the runtime
  notifyChanges({ external: true });

  return newRundown;
}

/**
 * swaps two events
 * @param {string} from - id of event from
 * @param {string} to - id of event to
 * @returns {Promise<void>}
 */
export async function swapEvents(from: string, to: string) {
  const scopedMutation = cache.mutateCache(cache.swap);
  await scopedMutation({ fromId: from, toId: to });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: true, external: true });
}

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateRuntimeOnChange() {
  const { timedEventsOrder } = cache.getEventOrder();
  const numEvents = timedEventsOrder.length;
  const metadata = cache.getMetadata();

  // schedule an update for the end of the event loop
  setImmediate(() =>
    updateRundownData({
      numEvents,
      ...metadata,
    }),
  );
}

type NotifyChangesOptions = {
  timer?: boolean | string[]; // whether to notify the timer, could be a yes / no or an array of affected IDs
  external?: boolean; // whether to notify external services
  reload?: boolean; // major change, clients should consider refetching everything
};

/**
 * Notify services of changes in the rundown
 */
function notifyChanges(options: NotifyChangesOptions) {
  if (options.timer) {
    const { playableEventsOrder } = cache.getEventOrder();

    if (playableEventsOrder.length === 0) {
      runtimeService.stop();
    } else {
      // notify timer service of changed events
      // timer can be true or an array of changed IDs
      const affected = Array.isArray(options.timer) ? options.timer : undefined;
      runtimeService.notifyOfChangedEvents(affected);
    }
  }

  if (options.external) {
    // advice socket subscribers of change
    const payload = {
      target: 'RUNDOWN',
      changes: Array.isArray(options.timer) ? options.timer : undefined,
      reload: options.reload,
      revision: cache.getMetadata().revision,
    };
    sendRefetch(payload);
  }
}

/**
 * Sets a new rundown in the cache
 * and marks it as the currently loaded one
 */
export async function initRundown(rundown: Readonly<Rundown>, customFields: Readonly<CustomFields>) {
  await cache.init(rundown, customFields);

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer of change
  notifyChanges({ timer: true, external: true, reload: true });
}
