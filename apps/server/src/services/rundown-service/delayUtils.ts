import {
  OntimeRundown,
  isOntimeDelay,
  isOntimeBlock,
  isOntimeEvent,
  OntimeEvent,
  OntimeRundownDAO,
} from 'ontime-types';
import { getTimeFromPrevious, deleteAtIndex } from 'ontime-utils';

/**
 * Calculates all delays in a given rundown
 * @param rundown
 */
export function calculateRuntimeDelays(rundown: OntimeRundown) {
  let accumulatedDelay = 0;
  const updatedRundown = [...rundown];

  for (const [index, event] of updatedRundown.entries()) {
    if (isOntimeDelay(event)) {
      accumulatedDelay += event.duration;
    } else if (isOntimeBlock(event)) {
      accumulatedDelay = 0;
    } else if (isOntimeEvent(event)) {
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
    if (isOntimeDelay(event)) {
      accumulatedDelay += event.duration;
    } else if (isOntimeBlock(event)) {
      if (i === eventIndex) {
        accumulatedDelay = 0;
      } else {
        break;
      }
    } else if (isOntimeEvent(event)) {
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

  if (isOntimeDelay(event)) {
    return event.duration + getDelayAt(eventIndex - 1, rundown);
  } else if (isOntimeBlock(event)) {
    return 0;
  } else if (isOntimeEvent(event)) {
    return event.delay ?? 0;
  }
  return 0;
}

/**
 * Applies delay from given event ID, deletes the delay event after
 * @throws {Error} if event ID not found or is not a delay
 */
export function apply(eventId: string, rundown: OntimeRundownDAO): OntimeRundownDAO {
  const delayIndex = rundown.findIndex((event) => event.id === eventId);
  const delayEvent = rundown.at(delayIndex);

  if (!delayEvent) {
    throw new Error('Given event ID not found');
  }

  if (!isOntimeDelay(delayEvent)) {
    throw new Error('Given event ID is not a delay');
  }

  // if the delay is empty, or the last element, we can just delete it
  if (delayEvent.duration === 0 || delayIndex === rundown.length - 1) {
    return deleteAtIndex(delayIndex, rundown);
  }

  /**
   * We apply the delay to the rundown
   * This logic is mostly in sync with rundownCache.generate
   */
  const updatedRundown = structuredClone(rundown);
  let delayValue = delayEvent.duration;
  let lastEntry: OntimeEvent | null = null;
  let isFirstEvent = true;

  for (let i = delayIndex + 1; i < updatedRundown.length; i++) {
    const currentEntry = updatedRundown[i];

    // we don't do operation on other event types
    if (!isOntimeEvent(currentEntry)) {
      continue;
    }

    // we need to remove the link in the first event to maintain the gap
    let shouldUnlink = isFirstEvent;
    isFirstEvent = false;

    // if the event is not linked, we try and maintain gaps
    if (lastEntry !== null) {
      const timeFromPrevious: number = getTimeFromPrevious(
        currentEntry.timeStart,
        lastEntry.timeStart,
        lastEntry.timeEnd,
        lastEntry.duration,
      );

      // when applying negative delays, we need to unlink the event
      // if the previous event was fully consumed by the delay
      if (currentEntry.linkStart && delayValue < 0 && lastEntry.timeStart + delayValue < 0) {
        shouldUnlink = true;
      }

      if (timeFromPrevious > 0) {
        delayValue = Math.max(delayValue - timeFromPrevious, 0);
      }

      if (delayValue === 0) {
        // we can bail from continuing if there are no further delays to apply
        break;
      }
    }

    // save the current entry before making mutations on its values
    lastEntry = { ...currentEntry };

    if (shouldUnlink) {
      currentEntry.linkStart = null;
      shouldUnlink = false;
    }

    // event times move up by the delay value
    // we dont update the delay value since we would need to iterate through the entire dataset
    // this is handled by the rundownCache.generate function
    currentEntry.timeStart = Math.max(0, currentEntry.timeStart + delayValue);
    currentEntry.timeEnd = Math.max(currentEntry.duration, currentEntry.timeEnd + delayValue);
    currentEntry.revision += 1;
  }

  return deleteAtIndex(delayIndex, updatedRundown);
}
