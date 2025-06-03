import { CustomFields, isOntimeBlock, isOntimeDelay, isOntimeEvent, Rundown, EntryId } from 'ontime-types';

import { RefetchTargets, sendRefetch } from '../../adapters/websocketAux.js';
import { updateRundownData } from '../../stores/runtimeState.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';

import * as cache from './rundownCache.js';

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
export async function ungroupEntries(blockId: EntryId) {
  const scopedMutation = cache.mutateCache(cache.ungroup);
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
      target: RefetchTargets.Rundown,
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
