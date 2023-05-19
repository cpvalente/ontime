import { OntimeBaseEvent, OntimeBlock, OntimeDelay, OntimeEvent, SupportedEvent } from 'ontime-types';
import { generateId } from 'ontime-utils';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { block as blockDef, delay as delayDef, event as eventDef } from '../models/eventsDefinition.js';
import { MAX_EVENTS } from '../settings.js';
import { EventLoader, eventLoader } from '../classes/event-loader/EventLoader.js';
import { eventTimer } from './TimerService.js';
import { sendRefetch } from '../adapters/websocketAux.js';

/**
 * Forces rundown to be recalculated
 * To be used when we know the rundown has changed completely
 */
export function forceReset() {
  eventLoader.reset();
  sendRefetch();
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
 * Updates timer object
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
    case 'event':
      newEvent = { ...eventDef, ...eventData, id } as Partial<OntimeEvent>;
      break;
    case 'delay':
      newEvent = { ...delayDef, ...eventData, id } as Partial<OntimeDelay>;
      break;
    case 'block':
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
  updateTimer([id]);
  updateChangeNumEvents();
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
  updateTimer([eventId]);
  sendRefetch();
  return newEvent;
}

/**
 * deletes event by its ID
 * @param eventId
 * @returns {Promise<void>}
 */
export async function deleteEvent(eventId) {
  await DataProvider.deleteEvent(eventId);
  updateTimer([eventId]);
  updateChangeNumEvents();
  sendRefetch();
}

/**
 * deletes all events in database
 * @returns {Promise<void>}
 */
export async function deleteAllEvents() {
  await DataProvider.clearRundown();
  updateTimer();
  updateChangeNumEvents();
  sendRefetch();
}

/**
 * reorders a given event
 * @param {string} eventId
 * @param {number} from
 * @param {number} to
 * @returns {Promise<void>}
 */
export async function reorderEvent(eventId, from, to) {
  const rundown = DataProvider.getRundown();
  const index = rundown.findIndex((event) => event.id === eventId);

  if (index !== from) {
    throw new Error('ID not found at index');
  }
  const [reorderedItem] = rundown.splice(from, 1);

  // reinsert item at to
  rundown.splice(to, 0, reorderedItem);

  // save rundown
  await DataProvider.setRundown(rundown);
  updateTimer();
  sendRefetch();
  return reorderedItem;
}

/**
 * applies delay value for given event
 * @param eventId
 * @returns {Promise<void>}
 */
export async function applyDelay(eventId: string) {
  const rundown = DataProvider.getRundown();
  let delayIndex = null;
  let delayValue = 0;

  for (const [index, event] of rundown.entries()) {
    // look for delay
    if (delayIndex === null) {
      if (event.id === eventId && event.type === SupportedEvent.Delay) {
        delayValue = event.duration;
        delayIndex = index;
      }
    }

    // apply delay value to all items until block or end
    else {
      if (event.type === SupportedEvent.Event) {
        event.timeStart = Math.max(0, event.timeStart + delayValue);
        event.timeEnd = Math.max(event.duration, event.timeStart + delayValue);
        event.revision += 1;
      } else if (event.type === SupportedEvent.Block) {
        break;
      }
    }
  }

  if (delayIndex === null) {
    throw new Error(`Delay event with ID ${eventId} not found`);
  }

  // delete delay
  rundown.splice(delayIndex, 1);

  // update rundown
  await DataProvider.setRundown(rundown);
  updateTimer();
  sendRefetch();
}

/**
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateChangeNumEvents() {
  eventLoader.updateNumEvents();
}
