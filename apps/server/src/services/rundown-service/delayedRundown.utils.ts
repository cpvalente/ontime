import { OntimeBlock, OntimeDelay, OntimeEvent, OntimeRundown, SupportedEvent } from 'ontime-types';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { getCached, runtimeCacheStore } from '../../stores/cachingStore.js';
import { isProduction } from '../../setup.js';
import { deleteAtIndex, insertAtIndex, reorderArray } from '../../utils/arrayUtils.js';

/**
 * Key of rundown in cache
 */
export const delayedRundownCacheKey = 'delayed-rundown';

/**
 * Invalidates the cached rundown when an inconsistency is found
 * will throw when not in production
 * @param errorMessage
 */
export function invalidateFromError(errorMessage = 'Found mismatch between store and cache') {
  if (isProduction) {
    runtimeCacheStore.invalidate(delayedRundownCacheKey);
  } else {
    throw new Error(errorMessage);
  }
}

/**
 * Returns rundown with calculated delays
 * Ensures request goes through the caching layer
 */
export function getDelayedRundown(): OntimeRundown {
  function calculateRundown() {
    const rundown = DataProvider.getRundown();
    return calculateRuntimeDelays(rundown);
  }

  return getCached(delayedRundownCacheKey, calculateRundown);
}

/**
 * Adds an event in the rundown at given index, ensuring replication to delayed rundown cache
 * @param eventIndex
 * @param event
 */
export async function cachedAdd(eventIndex: number, event: OntimeEvent | OntimeDelay | OntimeBlock) {
  // TODO: create wrapper function
  const rundown = DataProvider.getRundown();
  const newRundown = insertAtIndex(eventIndex, event, rundown);

  const delayedRundown = getDelayedRundown();
  let newDelayedRundown = insertAtIndex(eventIndex, event, delayedRundown);

  // update delay cache
  if (event.type === SupportedEvent.Event) {
    // if it is an event, we need its delay
    (newDelayedRundown[eventIndex] as OntimeEvent).delay = getDelayAt(eventIndex, newDelayedRundown);
  } else {
    // if it is a block or delay, we invalidate from here
    newDelayedRundown = calculateRuntimeDelaysFromIndex(eventIndex, newDelayedRundown);
  }

  runtimeCacheStore.setCached(delayedRundownCacheKey, newDelayedRundown);
  // we need to delay updating this to ensure add operation happens on same dataset
  await DataProvider.setRundown(newRundown);
}

/**
 * Edits an event in rundown, ensuring replication to delayed rundown cache
 * @param eventId
 * @param patchObject
 */
export async function cachedEdit(
  eventId: string,
  patchObject: Partial<OntimeEvent> | Partial<OntimeBlock> | Partial<OntimeDelay>,
) {
  const indexInMemory = DataProvider.getIndexOf(eventId);
  if (indexInMemory < 0) {
    throw new Error('No event with ID found');
  }

  const updatedRundown = DataProvider.getRundown();
  const newEvent = { ...updatedRundown[indexInMemory], ...patchObject };
  if (newEvent.type === SupportedEvent.Event) {
    newEvent.revision++;
  }
  // @ts-expect-error -- this merge is safe
  updatedRundown[indexInMemory] = newEvent;

  let newDelayedRundown = getDelayedRundown();
  if (newDelayedRundown?.[indexInMemory].id !== newEvent.id) {
    invalidateFromError();
  } else {
    // @ts-expect-error -- this merge is safe
    newDelayedRundown[indexInMemory] = newEvent;
    if (newEvent.type === SupportedEvent.Event) {
      (newDelayedRundown[indexInMemory] as OntimeEvent).delay = getDelayAt(indexInMemory, newDelayedRundown);
    } else if (newEvent.type === SupportedEvent.Delay) {
      // blocks have no reason to change the rundown, from delays we need to recalculate
      newDelayedRundown = calculateRuntimeDelaysFromIndex(indexInMemory, newDelayedRundown);
    }

    runtimeCacheStore.setCached(delayedRundownCacheKey, newDelayedRundown);
  }

  // we need to delay updating this to ensure edit operation happens on same dataset
  await DataProvider.setRundown(updatedRundown);

  return newEvent;
}

/**
 * Deletes an event with given id from rundown, ensuring replication to delayed rundown cache
 * @param eventId
 */
export async function cachedDelete(eventId: string) {
  const eventIndex = DataProvider.getIndexOf(eventId);
  let delayedRundown = getDelayedRundown();

  if (eventIndex < 0) {
    if (delayedRundown.findIndex((event) => event.id === eventId) >= 0) {
      invalidateFromError();
    }
    return;
  }

  let updatedRundown = DataProvider.getRundown();
  const eventType = updatedRundown[eventIndex].type;
  updatedRundown = deleteAtIndex(eventIndex, updatedRundown);
  if (eventId !== delayedRundown[eventIndex].id) {
    invalidateFromError();
  } else {
    delayedRundown = deleteAtIndex(eventIndex, delayedRundown);
    if (eventType === SupportedEvent.Delay || eventType === SupportedEvent.Block) {
      // for events, we do not have to worry
      // the following event, would have taken the place of the deleted event by now
      delayedRundown = calculateRuntimeDelaysFromIndex(eventIndex, delayedRundown);
    }
    runtimeCacheStore.setCached(delayedRundownCacheKey, delayedRundown);
  }
  // we need to delay updating this to ensure edit operation happens on same dataset
  await DataProvider.setRundown(updatedRundown);
}

/**
 * Reorders an event in the rundown, ensuring replication to delayed rundown cache
 * @param eventId
 * @param from
 * @param to
 */
export async function cachedReorder(eventId: string, from: number, to: number) {
  const indexCheck = DataProvider.getIndexOf(eventId);
  if (indexCheck !== from) {
    invalidateFromError();
    throw new Error('ID not found at index');
  }

  let updatedRundown = DataProvider.getRundown();
  const reorderedEvent = updatedRundown[from];
  updatedRundown = reorderArray(updatedRundown, from, to);

  const delayedRundown = getDelayedRundown();
  if (eventId !== delayedRundown[from].id) {
    invalidateFromError();
  } else {
    // TODO: could we be more granular about updates
    // I fear we need to update both from and to, which could signify more iterations
    runtimeCacheStore.invalidate(delayedRundownCacheKey);
  }

  // we need to delay updating this to ensure edit operation happens on same dataset
  await DataProvider.setRundown(updatedRundown);

  return reorderedEvent;
}

/**
 * Calculates all delays in a given rundown
 * @param rundown
 */
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

/**
 * Calculate delays in rundown from a given index
 * @param eventIndex
 * @param rundown
 */
export function calculateRuntimeDelaysFromIndex(eventIndex: number, rundown: OntimeRundown) {
  if (eventIndex === -1) {
    throw new Error('ID not found at index');
  }

  let accumulatedDelay = getDelayAt(eventIndex, rundown);
  const updatedRundown = [...rundown];

  for (let i = eventIndex; i < rundown.length; i++) {
    const event = rundown[i];
    if (event.type === SupportedEvent.Delay) {
      accumulatedDelay += event.duration;
    } else if (event.type === SupportedEvent.Block) {
      if (i === eventIndex) {
        accumulatedDelay = 0;
      } else {
        break;
      }
    } else if (event.type === SupportedEvent.Event) {
      updatedRundown[i] = {
        ...event,
        delay: accumulatedDelay,
      };
    }
  }
  return updatedRundown;
}

/**
 * Calculate delays in rundown from an event with given id
 * @param eventId
 * @param rundown
 */
export function calculateRuntimeDelaysFrom(eventId: string, rundown: OntimeRundown) {
  const index = rundown.findIndex((event) => event.id === eventId);
  return calculateRuntimeDelaysFromIndex(index, rundown);
}

/**
 * Calculates delay to an event at a given index
 * @param eventIndex
 * @param rundown
 */
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
