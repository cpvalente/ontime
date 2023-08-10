import {
  LogOrigin,
  OntimeBaseEvent,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeRundown,
  SupportedEvent,
} from 'ontime-types';
import { generateId } from 'ontime-utils';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { block as blockDef, delay as delayDef, event as eventDef } from '../../models/eventsDefinition.js';
import { MAX_EVENTS } from '../../settings.js';
import { EventLoader, eventLoader } from '../../classes/event-loader/EventLoader.js';
import { eventTimer } from '../TimerService.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { runtimeCacheStore } from '../../stores/cachingStore.js';
import {
  cachedAdd,
  cachedDelete,
  cachedEdit,
  cachedReorder,
  cachedSwap,
  delayedRundownCacheKey,
} from './delayedRundown.utils.js';
import { logger } from '../../classes/Logger.js';

/**
 * Forces rundown to be recalculated
 * To be used when we know the rundown has changed completely
 */
export function forceReset() {
  eventLoader.reset();
  sendRefetch();
  runtimeCacheStore.invalidate(delayedRundownCacheKey);
}

/**
 * Checks if a list of IDs is in the current selection
 */
const affectedLoaded = (affectedIds: string[]) => {
  const now = eventLoader.loaded.selectedEventId;
  const nowPublic = eventLoader.loaded.selectedPublicEventId;
  const next = eventLoader.loaded.nextEventId;
  const nextPublic = eventLoader.loaded.nextPublicEventId;
  return (
    affectedIds.includes(now) ||
    affectedIds.includes(nowPublic) ||
    affectedIds.includes(next) ||
    affectedIds.includes(nextPublic)
  );
};

/**
 * Checks if timer replaces the loaded next
 */
const isNewNext = () => {
  const timedEvents = EventLoader.getTimedEvents();
  const now = eventLoader.loaded.selectedEventId;
  const next = eventLoader.loaded.nextEventId;

  // check whether the index of now and next are consecutive
  const indexNow = timedEvents.findIndex((event) => event.id === now);
  const indexNext = timedEvents.findIndex((event) => event.id === next);

  if (indexNext - indexNow !== 1) {
    return true;
  }
  // iterate through timed events and see if there are public events between nowPublic and nextPublic
  const nowPublic = eventLoader.loaded.selectedPublicEventId;
  const nextPublic = eventLoader.loaded.nextPublicEventId;

  let foundNew = false;
  let isAfter = false;
  for (const event of timedEvents) {
    if (!isAfter) {
      if (event.id === nowPublic) {
        isAfter = true;
      }
    } else {
      if (event.id === nextPublic) {
        break;
      }
      if (event.isPublic) {
        foundNew = true;
        break;
      }
    }
  }

  return foundNew;
};

/**
 * Updates timer service when a relevant piece of data changes
 */
export function updateTimer(affectedIds?: string[]) {
  const runningEventId = eventLoader.loaded.selectedEventId;

  if (runningEventId === null) {
    return false;
  }

  // we need to reload in a few scenarios:
  // 1. we are not confident that changes do not affect running event
  const safeOption = typeof affectedIds === 'undefined';
  // 2. the edited event is in memory (now or next) running
  const eventInMemory = safeOption ? false : affectedLoaded(affectedIds);
  // 3. the edited event replaces next event
  const isNext = isNewNext();

  if (safeOption) {
    eventLoader.reset();
    const { loadedEvent } = eventLoader.loadById(runningEventId) || {};
    eventTimer.hotReload(loadedEvent);
    return true;
  }

  if (eventInMemory) {
    eventLoader.reset();
    const { loadedEvent } = eventLoader.loadById(runningEventId) || {};
    if (!loadedEvent) {
      eventTimer.stop();
    } else {
      eventTimer.hotReload(loadedEvent);
    }
    return true;
  }

  if (isNext) {
    const { loadedEvent } = eventLoader.loadById(runningEventId) || {};
    eventTimer.hotReload(loadedEvent);
    return true;
  }
  return false;
}

/**
 * @description creates a new event with given data
 * @param {object} eventData
 * @return {unknown[]}
 */
export async function addEvent(eventData: Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeBlock>) {
  const numEvents = DataProvider.getRundownLength();
  if (numEvents > MAX_EVENTS) {
    throw new Error(`ERROR: Reached limit number of ${MAX_EVENTS} events`);
  }

  let newEvent: Partial<OntimeBaseEvent> = {};
  const id = generateId();

  // TODO: filter the parameters that exist in the event, use the parserUtils
  switch (eventData.type) {
    case SupportedEvent.Event:
      newEvent = { ...eventDef, ...eventData, id };
      break;
    case SupportedEvent.Delay:
      newEvent = { ...delayDef, ...eventData, id };
      break;
    case SupportedEvent.Block:
      newEvent = { ...blockDef, ...eventData, id };
      break;
  }

  let insertIndex = 0;
  if (typeof newEvent?.after !== 'undefined') {
    const index = DataProvider.getIndexOf(newEvent.after);
    if (index < 0) {
      logger.warning(LogOrigin.Server, `Could not find event with id ${newEvent.after}`);
    } else {
      insertIndex = index + 1;
    }
    delete newEvent.after;
  }

  // modify rundown
  await cachedAdd(insertIndex, newEvent as OntimeEvent | OntimeDelay | OntimeBlock);

  // notify timer service of changed events
  updateTimer([id]);

  // notify event loader that rundown size has changed
  updateChangeNumEvents();

  // advice socket subscribers of change
  sendRefetch();

  return newEvent;
}

export async function editEvent(eventData: Partial<OntimeEvent> | Partial<OntimeBlock> | Partial<OntimeDelay>) {
  const newEvent = await cachedEdit(eventData.id, eventData);

  // notify timer service of changed events
  updateTimer([newEvent.id]);

  // advice socket subscribers of change
  sendRefetch();

  return newEvent;
}

/**
 * deletes event by its ID
 * @param eventId
 * @returns {Promise<void>}
 */
export async function deleteEvent(eventId) {
  await cachedDelete(eventId);

  // notify timer service of changed events
  updateTimer([eventId]);

  // notify event loader that rundown size has changed
  updateChangeNumEvents();

  // invalidate cache
  runtimeCacheStore.invalidate(delayedRundownCacheKey);

  // advice socket subscribers of change
  sendRefetch();
}

/**
 * deletes all events in database
 * @returns {Promise<void>}
 */
export async function deleteAllEvents() {
  await DataProvider.clearRundown();
  updateTimer();
  forceReset();
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

  // notify timer service of changed events
  updateTimer();

  // advice socket subscribers of change
  sendRefetch();
  return reorderedItem;
}

export function _applyDelay(
  eventId: string,
  rundown: OntimeRundown,
): {
  delayIndex: number | null;
  updatedRundown: OntimeRundown;
} {
  const updatedRundown = [...rundown];
  let delayIndex = null;
  let delayValue = 0;

  for (const [index, event] of updatedRundown.entries()) {
    // look for delay
    if (delayIndex === null) {
      if (event.type === SupportedEvent.Delay && event.id === eventId) {
        delayValue = event.duration;
        delayIndex = index;

        if (delayValue === 0) {
          // nothing to apply
          break;
        }
      }
      continue;
    }

    // once delay is found, apply delay value to all items until block or end
    if (event.type === SupportedEvent.Event) {
      updatedRundown[index] = {
        ...event,
        timeStart: Math.max(0, event.timeStart + delayValue),
        timeEnd: Math.max(event.duration, event.timeEnd + delayValue),
        revision: event.revision + 1,
      };
    } else if (event.type === SupportedEvent.Block) {
      break;
    }
  }

  return { delayIndex, updatedRundown };
}

/**
 * swaps two events
 * @param {string} from - id of event from
 * @param {string} to - id of event to
 * @returns {Promise<void>}
 */
export async function swapEvents(from: string, to: string) {
  await cachedSwap(from, to);

  // notify timer service of changed events
  updateTimer();

  // advice socket subscribers of change
  sendRefetch();
}

/**
 * applies delay value for given event
 * @param eventId
 * @returns {Promise<void>}
 */
export async function applyDelay(eventId: string) {
  const rundown: OntimeRundown = DataProvider.getRundown();
  const { delayIndex, updatedRundown } = _applyDelay(eventId, rundown);
  if (delayIndex === null) {
    throw new Error(`Delay event with ID ${eventId} not found`);
  }

  await DataProvider.setRundown(updatedRundown);
  await deleteEvent(eventId);
}

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateChangeNumEvents() {
  eventLoader.updateNumEvents();
}
