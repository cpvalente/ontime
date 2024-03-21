import {
  CustomFields,
  LogOrigin,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeRundownEntry,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeRundown,
} from 'ontime-types';
import { getCueCandidate } from 'ontime-utils';

import { block as blockDef, delay as delayDef } from '../../models/eventsDefinition.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { logger } from '../../classes/Logger.js';
import { createEvent } from '../../utils/parser.js';
import { updateRundownData } from '../../stores/runtimeState.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';

import * as cache from './rundownCache.js';
import { getPlayableEvents } from './rundownUtils.js';

function generateEvent(eventData: Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeBlock>) {
  // we discard any UI provided events and add our own
  const id = cache.getUniqueId();

  if (isOntimeEvent(eventData)) {
    return createEvent(eventData, getCueCandidate(cache.getPersistedRundown(), eventData?.after)) as OntimeEvent;
  }

  if (isOntimeDelay(eventData)) {
    return { ...delayDef, duration: eventData.duration ?? 0, id } as OntimeDelay;
  }

  if (isOntimeBlock(eventData)) {
    return { ...blockDef, title: eventData?.title ?? '', id } as OntimeBlock;
  }

  throw new Error('Invalid event type');
}

/**
 * @description creates a new event with given data
 * @param {object} eventData
 * @return {OntimeRundownEntry}
 */
export async function addEvent(
  eventData: Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeBlock>,
): Promise<OntimeRundownEntry> {
  // if the user didnt provide an index, we add the event to start
  let atIndex = 0;
  if (eventData?.after !== undefined) {
    const previousIndex = cache.getIndexOf(eventData.after);
    if (previousIndex < 0) {
      logger.warning(LogOrigin.Server, `Could not find event with id ${eventData.after}`);
    } else {
      atIndex = previousIndex + 1;
    }
  }

  // generate a fully formed event from the patch
  const eventToAdd = generateEvent(eventData);
  // modify rundown
  const scopedMutation = cache.mutateCache(cache.add);
  const { newEvent } = await scopedMutation({ atIndex, event: eventToAdd as OntimeRundownEntry });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: [newEvent.id], external: true });

  return newEvent;
}

/**
 * deletes event by its ID
 * @param eventId
 */
export async function deleteEvent(eventId: string) {
  const scopedMutation = cache.mutateCache(cache.remove);
  await scopedMutation({ eventId });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: [eventId], external: true });
}

/**
 * deletes all events in database
 */
export async function deleteAllEvents() {
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
export async function editEvent(patch: Partial<OntimeEvent> | Partial<OntimeBlock> | Partial<OntimeDelay>) {
  if (isOntimeEvent(patch) && patch?.cue === '') {
    throw new Error('Cue value invalid');
  }

  const scopedMutation = cache.mutateCache(cache.edit);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know patch has an id
  const { newEvent } = await scopedMutation({ patch, eventId: patch.id! });

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
 * reorders a given event
 * @param {string} eventId - ID of event from, for sanity check
 * @param {number} from - index of event from
 * @param {number} to - index of event to
 */
export async function reorderEvent(eventId: string, from: number, to: number) {
  const scopedMutation = cache.mutateCache(cache.reorder);
  const reorderedItem = await scopedMutation({ eventId, from, to });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: true, external: true });

  return reorderedItem;
}

export async function applyDelay(eventId: string) {
  const scopedMutation = cache.mutateCache(cache.applyDelay);
  await scopedMutation({ eventId });

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer and external services of change
  notifyChanges({ timer: true, external: true });
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
  const playableEvents = getPlayableEvents();
  const numEvents = playableEvents.length;
  const metadata = cache.getMetadata();

  // schedule an update for the end of the event loop
  setImmediate(() =>
    updateRundownData({
      numEvents,
      ...metadata,
    }),
  );
}

/**
 * Notify services of changes in the rundown
 */
function notifyChanges(options: { timer?: boolean | string[]; external?: boolean }) {
  if (options.timer) {
    const playableEvents = getPlayableEvents();

    if (playableEvents.length === 0) {
      runtimeService.stop();
    } else {
      // notify timer service of changed events
      // timer can be true or an array of changed IDs
      const affected = Array.isArray(options.timer) ? options.timer : undefined;
      runtimeService.maybeUpdate(playableEvents, affected);
    }
  }

  if (options.external) {
    // advice socket subscribers of change
    sendRefetch();
  }
}

/**
 * Overrides the rundown with the given
 * @param rundown
 */
export async function initRundown(rundown: OntimeRundown, customFields: CustomFields) {
  await cache.init(rundown, customFields);

  // notify runtime that rundown has changed
  updateRuntimeOnChange();

  // notify timer of change
  notifyChanges({ timer: true });
}
