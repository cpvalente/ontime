import { OntimeRundown, isOntimeDelay, isOntimeBlock, isOntimeEvent } from 'ontime-types';

import { deleteAtIndex } from '../../../../../packages/utils/src/array-utils/arrayUtils.js';

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
 * @param eventId
 * @param rundown
 * @throws {Error} if event ID not found or is not a delay
 * @returns
 */
export function apply(eventId: string, rundown: OntimeRundown): OntimeRundown {
  const delayIndex = rundown.findIndex((event) => event.id === eventId);
  const delayEvent = rundown.at(delayIndex);

  if (!delayEvent) {
    throw new Error('Given event ID not found');
  }

  if (!isOntimeDelay(delayEvent)) {
    throw new Error('Given event ID is not a delay');
  }

  const updatedRundown = [...rundown];
  const delayValue = delayEvent.duration;

  if (delayValue === 0 || delayIndex === rundown.length - 1) {
    // nothing to apply
    return updatedRundown;
  }

  for (let i = delayIndex + 1; i < rundown.length; i++) {
    const currentEvent = updatedRundown[i];

    if (isOntimeBlock(currentEvent)) {
      break;
    } else if (isOntimeEvent(currentEvent)) {
      currentEvent.timeStart = Math.max(0, currentEvent.timeStart + delayValue);
      currentEvent.timeEnd = Math.max(currentEvent.duration, currentEvent.timeEnd + delayValue);
      if (currentEvent.delay) {
        currentEvent.delay = currentEvent.delay - delayValue;
      }
      currentEvent.revision += 1;
    }
  }

  return deleteAtIndex(delayIndex, updatedRundown);
}
