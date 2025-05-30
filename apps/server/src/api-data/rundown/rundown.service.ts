import { CustomFields, EntryId, EventPostPayload, isOntimeBlock, OntimeEntry, Rundown } from 'ontime-types';

import { getPreviousId } from '../../services/rundown-service/rundownUtils.js';
import { updateRundownData } from '../../stores/runtimeState.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { runtimeService } from '../../services/runtime-service/RuntimeService.js';

import { createTransaction, rundownCache, rundownMutation } from './rundown.dao.js';
import { RundownMetadata } from './rundown.types.js';
import { generateEvent } from './rundown.utils.js';

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
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateRuntimeOnChange(rundownMetadata: RundownMetadata) {
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
