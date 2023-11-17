import { isOntimeEvent, OntimeEvent, OntimeRundown, OntimeRundownEntry } from 'ontime-types';

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
    const event = rundown[i];
    if (isOntimeEvent(event)) {
      return event;
    }
  }
  return null;
}

export function getLastEvent(rundown: OntimeRundown): OntimeEvent | null {
  if (rundown.length < 1) {
    return null;
  }

  for (let i = rundown.length - 1; i > 0; i--) {
    const event = rundown.at(i);
    if (isOntimeEvent(event)) {
      return event;
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
    const event = rundown[i];
    if (isOntimeEvent(event)) {
      return event;
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
    const event = rundown[i];
    if (isOntimeEvent(event)) {
      return event;
    }
  }
  return null;
}

/**
 * @description swaps two OntimeEvents in the rundown
 * @param {OntimeRundown} rundown
 * @param {number} fromEventIndex
 * @param {number} toEventIndex
 * @returns {OntimeRundown}
 */
export const swapOntimeEvents = (
  rundown: OntimeRundown,
  fromEventIndex: number,
  toEventIndex: number,
): OntimeRundown => {
  const updatedRundown = [...rundown];

  if (fromEventIndex < 0 || toEventIndex < 0) {
    throw new Error('ID not found at index');
  }

  const fromEvent = updatedRundown.at(fromEventIndex) as OntimeEvent;
  const toEvent = updatedRundown.at(toEventIndex) as OntimeEvent;

  updatedRundown[fromEventIndex] = {
    ...toEvent,
    timeStart: fromEvent.timeStart,
    timeEnd: fromEvent.timeEnd,
    duration: fromEvent.duration,
    delay: fromEvent.delay,
  };

  updatedRundown[toEventIndex] = {
    ...fromEvent,
    timeStart: toEvent.timeStart,
    timeEnd: toEvent.timeEnd,
    duration: toEvent.duration,
    delay: toEvent.delay,
  };

  return updatedRundown;
};
