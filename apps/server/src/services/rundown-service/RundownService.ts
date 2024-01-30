import {
  LogOrigin,
  OntimeBaseEvent,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  SupportedEvent,
  isOntimeEvent,
} from 'ontime-types';
import { generateId, getCueCandidate } from 'ontime-utils';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { block as blockDef, delay as delayDef } from '../../models/eventsDefinition.js';
import { MAX_EVENTS } from '../../settings.js';
import { EventLoader } from '../../classes/event-loader/EventLoader.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { runtimeCacheStore } from '../../stores/cachingStore.js';
import {
  cachedAdd,
  cachedApplyDelay,
  cachedClear,
  cachedDelete,
  cachedEdit,
  cachedBatchEdit,
  cachedReorder,
  cachedSwap,
  delayedRundownCacheKey,
} from './delayedRundown.utils.js';
import { logger } from '../../classes/Logger.js';
import { createEvent } from '../../utils/parser.js';
import { updateNumEvents } from '../../stores/runtimeState.js';
import { runtimeService } from '../runtime-service/RuntimeService.js';

/**
 * Forces rundown to be recalculated
 * To be used when we know the rundown has changed completely
 */
export function forceReset() {
  runtimeService.reset();
  runtimeCacheStore.invalidate(delayedRundownCacheKey);
}
/**
 * @description creates a new event with given data
 * @param {object} eventData
 * @return {unknown[]}
 */
export async function addEvent(eventData: Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeBlock>) {
  const numEvents = DataProvider.getRundownLength();
  if (numEvents > MAX_EVENTS) {
    throw new Error(`Reached limit number of ${MAX_EVENTS} events`);
  }

  let newEvent: Partial<OntimeBaseEvent> = {};
  const id = generateId();

  let insertIndex = 0;
  if (eventData?.after !== undefined) {
    const index = DataProvider.getIndexOf(eventData.after);
    if (index < 0) {
      logger.warning(LogOrigin.Server, `Could not find event with id ${eventData.after}`);
    } else {
      insertIndex = index + 1;
    }
  }

  switch (eventData.type) {
    case SupportedEvent.Event: {
      newEvent = createEvent(eventData, getCueCandidate(DataProvider.getRundown(), eventData?.after)) as OntimeEvent;
      break;
    }
    case SupportedEvent.Delay:
      newEvent = { ...delayDef, duration: eventData.duration, id } as OntimeDelay;
      break;
    case SupportedEvent.Block:
      newEvent = { ...blockDef, title: eventData.title, id } as OntimeBlock;
      break;
  }
  delete eventData.after;

  // modify rundown
  await cachedAdd(insertIndex, newEvent as OntimeEvent | OntimeDelay | OntimeBlock);

  notifyChanges({ timer: [id], external: true });

  // notify event loader that rundown size has changed
  updateChangeNumEvents();

  return newEvent;
}

export async function editEvent(eventData: Partial<OntimeEvent> | Partial<OntimeBlock> | Partial<OntimeDelay>) {
  if (!eventData?.id) {
    throw new Error('Event misses ID');
  }
  if (isOntimeEvent(eventData) && eventData?.cue === '') {
    throw new Error('Cue value invalid');
  }

  const newEvent = await cachedEdit(eventData.id, eventData);

  notifyChanges({ timer: [newEvent.id], external: true });

  return newEvent;
}

export async function batchEditEvents(ids: string[], data: Partial<OntimeEvent>) {
  await cachedBatchEdit(ids, data);

  // notify runtime service of changed events
  runtimeService.update(ids);

  // advice socket subscribers of change
  sendRefetch();
}

/**
 * deletes event by its ID
 * @param eventId
 * @returns {Promise<void>}
 */
export async function deleteEvent(eventId: string) {
  await cachedDelete(eventId);

  notifyChanges({ timer: [eventId], external: true });
  // notify event loader that rundown size has changed
  updateChangeNumEvents();
}

/**
 * deletes all events in database
 * @returns {Promise<void>}
 */
export async function deleteAllEvents() {
  await cachedClear();

  // no need to modify timer since we will reset
  notifyChanges({ external: true, reset: true });
}

/**
 * reorders a given event
 * @param {string} eventId - ID of event from, for sanity check
 * @param {number} from - index of event from
 * @param {number} to - index of event to
 * @returns {Promise<void>}
 */
export async function reorderEvent(eventId: string, from: number, to: number) {
  const reorderedItem = await cachedReorder(eventId, from, to);

  notifyChanges({ timer: true, external: true });

  return reorderedItem;
}

export async function applyDelay(eventId: string) {
  await cachedApplyDelay(eventId);

  notifyChanges({ timer: true, external: true });
}

/**
 * swaps two events
 * @param {string} from - id of event from
 * @param {string} to - id of event to
 * @returns {Promise<void>}
 */
export async function swapEvents(from: string, to: string) {
  await cachedSwap(from, to);

  notifyChanges({ timer: true, external: true });
}

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateChangeNumEvents() {
  const numEvents = EventLoader.getPlayableEvents().length;
  updateNumEvents(numEvents);
}

/**
 * Notify services of changes in the rundown
 */
export function notifyChanges(options: { timer?: boolean | string[]; external?: boolean; reset?: boolean }) {
  if (options.timer) {
    // notify timer service of changed events
    // timer can be true or an array of changed IDs
    if (Array.isArray(options.timer)) {
      runtimeService.update(options.timer);
    }
    runtimeService.update();
  }

  if (options.reset) {
    // force rundown to be recalculated
    forceReset();
  }

  if (options.external) {
    // advice socket subscribers of change
    sendRefetch();
  }
}
