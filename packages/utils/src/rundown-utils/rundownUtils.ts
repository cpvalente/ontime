import { OntimeEvent, OntimeRundownEntry, SupportedEvent } from 'ontime-types';

import { dayInMs } from '../timeConstants.js';

/**
 * Gets first event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @return {OntimeRundownEntry | null}
 */
export function getFirst(rundown: OntimeRundownEntry[]) {
  return rundown.length ? rundown[0] : null;
}

/**
 * Gets first scheduled event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @return {OntimeEvent | null}
 */
export function getFirstEvent(rundown: OntimeRundownEntry[]) {
  for (let i = 0; i < rundown.length; i++) {
    if (rundown[i].type === SupportedEvent.Event) {
      return rundown[i] as OntimeEvent;
    }
  }
  return null;
}

/**
 * Gets next event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {OntimeRundownEntry | null}
 */
export function getNext(rundown: OntimeRundownEntry[], currentId: string): OntimeRundownEntry | null {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index !== -1 && index + 1 < rundown.length) {
    return rundown[index + 1];
  } else {
    return null;
  }
}

/**
 * Gets next scheduled event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {OntimeEvent | null}
 */
export function getNextEvent(rundown: OntimeRundownEntry[], currentId: string): OntimeEvent | null {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index < 0) {
    return null;
  }

  for (let i = index + 1; i < rundown.length; i++) {
    if (rundown[i].type === SupportedEvent.Event) {
      return rundown[i] as OntimeEvent;
    }
  }
  return null;
}

/**
 * Gets previous event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {OntimeRundownEntry | null}
 */
export function getPrevious(rundown: OntimeRundownEntry[], currentId: string) {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index !== -1 && index - 1 >= 0) {
    return rundown[index - 1];
  } else {
    return null;
  }
}

/**
 * Gets previous scheduled event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {OntimeEvent | null}
 */
export function getPreviousEvent(rundown: OntimeRundownEntry[], currentId: string): OntimeEvent | null {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index < 0) {
    return null;
  }

  for (let i = index - 1; i >= 0; i--) {
    if (rundown[i].type === SupportedEvent.Event) {
      return rundown[i] as OntimeEvent;
    }
  }
  return null;
}

/**
 * @description calculates event duration considering midnight
 * @param {number} timeStart
 * @param {number} timeEnd
 * @returns {number}
 */
export const calculateDuration = (timeStart: number, timeEnd: number): number => {
  // Durations must be positive
  if (timeEnd < timeStart) {
    return timeEnd + dayInMs - timeStart;
  }
  return timeEnd - timeStart;
};
