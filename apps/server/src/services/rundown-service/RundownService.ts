import {
  LogOrigin,
  OntimeBaseEvent,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  Playback,
  SupportedEvent,
} from 'ontime-types';
import { generateId, getCueCandidate } from 'ontime-utils';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { block as blockDef, delay as delayDef } from '../../models/eventsDefinition.js';
import { MAX_EVENTS } from '../../settings.js';
import { EventLoader, eventLoader } from '../../classes/event-loader/EventLoader.js';
import { eventTimer } from '../TimerService.js';
import { sendRefetch } from '../../adapters/websocketAux.js';
import { runtimeCacheStore } from '../../stores/cachingStore.js';
import {
  cachedAdd,
  cachedApplyDelay,
  cachedClear,
  cachedDelete,
  cachedEdit,
  cachedReorder,
  cachedSwap,
  delayedRundownCacheKey,
} from './delayedRundown.utils.js';
import { logger } from '../../classes/Logger.js';
import { validateEvent } from '../../utils/parser.js';
import { clock } from '../Clock.js';

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
  const nextEventId = eventLoader.loaded.nextEventId;

  if (runningEventId === null && nextEventId === null) {
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

    if (eventTimer.playback === Playback.Roll) {
      const rollTimers = eventLoader.findRoll(clock.timeNow());
      if (rollTimers === null) {
        eventTimer.stop();
      } else {
        const { currentEvent, nextEvent } = rollTimers;
        eventTimer.roll(currentEvent, nextEvent);
      }
    } else {
      const { loadedEvent } = eventLoader.loadById(runningEventId) || {};
      if (loadedEvent) {
        eventTimer.hotReload(loadedEvent);
      } else {
        eventTimer.stop();
      }
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
      newEvent = validateEvent(eventData, getCueCandidate(DataProvider.getRundown(), eventData?.after)) as OntimeEvent;
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

  // notify timer service of changed events
  updateTimer([id]);

  // notify event loader that rundown size has changed
  updateChangeNumEvents();

  // advice socket subscribers of change
  sendRefetch();

  return newEvent;
}

export async function editEvent(eventData: Partial<OntimeEvent> | Partial<OntimeBlock> | Partial<OntimeDelay>) {
  if (eventData.type === SupportedEvent.Event && eventData?.cue === '') {
    throw new Error(`Cue value invalid`);
  }

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

  // advice socket subscribers of change
  sendRefetch();
}

/**
 * deletes all events in database
 * @returns {Promise<void>}
 */
export async function deleteAllEvents() {
  await cachedClear();

  // notify timer service of changed events
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

export async function applyDelay(eventId: string) {
  await cachedApplyDelay(eventId);

  // notify timer service of changed events
  updateTimer();

  // advice socket subscribers of change
  sendRefetch();
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
 * Forces update in the store
 * Called when we make changes to the rundown object
 */
function updateChangeNumEvents() {
  eventLoader.updateNumEvents();
}

/**
 * Updates a property of the event with the given id
 * @param {string} eventId
 * @param {keyof OntimeEvent} propertyName
 * @param {OntimeEvent[typeof propertyName]} propertValue
 */
export function updateEvent(
  eventId: string,
  propertyName: keyof OntimeEvent,
  newValue: OntimeEvent[typeof propertyName],
) {
  const event = EventLoader.getEventWithId(eventId);

  if (event) {
    const propertiesToUpdate = { [propertyName]: newValue };

    // Handles the special case for duration
    if (propertyName === 'duration') {
      propertiesToUpdate.timeEnd = event.timeStart + (newValue as number);
    }

    editEvent({ id: eventId, ...propertiesToUpdate });
  } else {
    throw new Error(`Event with ID ${eventId} not found`);
  }
}
