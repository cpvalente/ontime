import { OntimeBaseEvent, OntimeBlock, OntimeDelay, OntimeEvent, OntimeRundown, SupportedEvent } from 'ontime-types';
import { generateId } from 'ontime-utils';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { block as blockDef, delay as delayDef, event, event as eventDef } from '../../models/eventsDefinition.js';
import { MAX_EVENTS } from '../../settings.js';
import { EventLoader, eventLoader } from '../../classes/event-loader/EventLoader.js';
import { eventTimer } from '../TimerService.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { getCached, runtimeCacheStore } from '../../stores/cachingStore.js';

const delayedRundownCacheKey = 'delayed-rundown';

export function getDelayedRundown(): OntimeRundown {
  function calculateRundown() {
    const rundown = DataProvider.getRundown();
    return calculateRuntimeDelays(rundown);
  }

  return getCached(delayedRundownCacheKey, calculateRundown);
}

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

  switch (eventData.type) {
    case SupportedEvent.Event:
      newEvent = { ...eventDef, ...eventData, id } as Partial<OntimeEvent>;
      break;
    case SupportedEvent.Delay:
      newEvent = { ...delayDef, ...eventData, id } as Partial<OntimeDelay>;
      break;
    case SupportedEvent.Block:
      newEvent = { ...blockDef, ...eventData, id } as Partial<OntimeBlock>;
      break;
  }

  try {
    const afterId = newEvent?.after;
    if (typeof afterId === 'undefined') {
      await DataProvider.insertEventAt(newEvent, 0);
    } else {
      delete newEvent.after;
      await DataProvider.insertEventAfterId(newEvent, afterId);
    }
  } catch (error) {
    throw new Error(error);
  }

  // notify timer service of changed events
  updateTimer([id]);

  // notify event loader that rundown size has changed
  updateChangeNumEvents();

  // update delay cache
  let delayedRundown = DataProvider.getRundown();
  switch (eventData.type) {
    case SupportedEvent.Event: {
      // we use the delay of the event before
      const eventIndex = delayedRundown.findIndex((event) => event.id === id);
      (delayedRundown[eventIndex] as OntimeEvent).delay = getDelayAt(eventIndex - 1, delayedRundown);
      newEvent = { ...eventDef, ...eventData, id } as Partial<OntimeEvent>;
      break;
    }
    case SupportedEvent.Delay:
    case SupportedEvent.Block:
      // we invalidate delays from here
      delayedRundown = calculateRuntimeDelaysFrom(id, delayedRundown);
      break;
  }
  runtimeCacheStore.setCached(delayedRundownCacheKey, delayedRundown);

  // advice socket subscribers of change
  sendRefetch();

  return newEvent;
}

export async function editEvent(eventData) {
  const eventId = eventData.id;
  const eventInMemory = DataProvider.getEventById(eventId);
  if (typeof eventInMemory === 'undefined') {
    throw new Error('No event with ID found');
  }
  const newEvent = await DataProvider.updateEventById(eventId, eventData);

  // notify timer service of changed events
  updateTimer([eventId]);

  let delayedRundown = DataProvider.getRundown();
  if (eventInMemory.type === SupportedEvent.Delay) {
    // we invalidate delays from here
    if (eventData.duration !== eventInMemory.duration) {
      delayedRundown = calculateRuntimeDelaysFrom(eventId, delayedRundown);
    }
  }
  runtimeCacheStore.setCached(delayedRundownCacheKey, delayedRundown);

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
  const deletedIndex = DataProvider.getIndexOf(eventId);
  if (deletedIndex < 0) {
    return;
  }

  const deletedEvent = DataProvider.getEventById(eventId);
  await DataProvider.deleteEvent(eventId);

  updateTimer([eventId]);

  // notify event loader that rundown size has changed
  updateChangeNumEvents();

  // update delay cache
  let delayedRundown = DataProvider.getRundown();
  switch (deletedEvent.type) {
    case SupportedEvent.Delay:
    case SupportedEvent.Block:
      // we invalidate delays from here
      delayedRundown = calculateRuntimeDelaysFrom(delayedRundown[deletedIndex].id, delayedRundown);
      break;
  }
  runtimeCacheStore.setCached(delayedRundownCacheKey, delayedRundown);

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
  const rundown = DataProvider.getRundown();
  const indexFrom = rundown.findIndex((event) => event.id === eventId);

  if (indexFrom !== from) {
    throw new Error('ID not found at index');
  }

  const [reorderedItem] = rundown.splice(from, 1);

  // reinsert item at to
  rundown.splice(to, 0, reorderedItem);

  // save rundown
  await DataProvider.setRundown(rundown);

  updateTimer();

  // TODO: only calculate delays if moved is block or delay
  let delayedRundown = calculateRuntimeDelaysFrom(eventId, rundown);
  delayedRundown = calculateRuntimeDelaysFrom(rundown[indexFrom].id, rundown);
  runtimeCacheStore.setCached(delayedRundownCacheKey, delayedRundown);

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
    if (delayIndex === null && event.type === SupportedEvent.Delay && event.id === eventId) {
      delayValue = event.duration;
      delayIndex = index;
      continue;
    }

    // apply delay value to all items until block or end
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
  await deleteEvent(event);
}

export function calculateRuntimeDelays(rundown: OntimeRundown) {
  let accumulatedDelay = 0;
  const updatedRundown = [...rundown];

  for (const [index, event] of updatedRundown.entries()) {
    if (event.type === SupportedEvent.Delay) {
      accumulatedDelay += event.duration;
    } else if (event.type === SupportedEvent.Block) {
      accumulatedDelay = 0;
    } else if (event.type === SupportedEvent.Event) {
      updatedRundown[index] = {
        ...event,
        delay: accumulatedDelay,
      };
    }
  }
  return updatedRundown;
}

export function calculateRuntimeDelaysFrom(eventId: string, rundown: OntimeRundown) {
  const index = rundown.findIndex((event) => event.id === eventId);
  if (index === -1) {
    throw new Error('ID not found at index');
  }

  let accumulatedDelay = getDelayAt(index, rundown);
  const updatedRundown = [...rundown];

  for (let i = index; i < rundown.length; i++) {
    const event = rundown[i];
    if (event.type === SupportedEvent.Delay) {
      accumulatedDelay += event.duration;
    } else if (event.type === SupportedEvent.Block) {
      break;
    } else if (event.type === SupportedEvent.Event) {
      updatedRundown[i] = {
        ...event,
        delay: accumulatedDelay,
      };
    }
  }
  return updatedRundown;
}

export function getDelayAt(eventIndex: number, rundown: OntimeRundown): number {
  if (eventIndex < 1) {
    return 0;
  }

  // we need to check the event before
  const event = rundown[eventIndex - 1];

  if (event.type === SupportedEvent.Delay) {
    return event.duration + getDelayAt(eventIndex - 1, rundown);
  } else if (event.type === SupportedEvent.Block) {
    return 0;
  } else if (event.type === SupportedEvent.Event) {
    return event.delay ?? 0;
  }
  return 0;
}

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateChangeNumEvents() {
  eventLoader.updateNumEvents();
}
