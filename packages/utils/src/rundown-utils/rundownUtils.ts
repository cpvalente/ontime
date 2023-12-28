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
 * @return {{ firstEvent: OntimeEvent | null; firstIndex: number | null } }
 */
export function getFirstEvent(rundown: OntimeRundownEntry[]): {
  firstEvent: OntimeEvent | null;
  firstIndex: number | null;
} {
  for (let i = 0; i < rundown.length; i++) {
    const firstEvent = rundown[i];
    if (isOntimeEvent(firstEvent)) {
      return { firstEvent, firstIndex: i };
    }
  }
  return { firstEvent: null, firstIndex: null };
}

export function getLastEvent(rundown: OntimeRundown): {
  lastEvent: OntimeEvent | null;
  lastIndex: number | null;
} {
  if (rundown.length < 1) {
    return { lastEvent: null, lastIndex: null };
  }

  for (let i = rundown.length - 1; i > 0; i--) {
    const lastEvent = rundown.at(i);
    if (isOntimeEvent(lastEvent)) {
      return { lastEvent, lastIndex: i };
    }
  }
  return { lastEvent: null, lastIndex: null };
}

/**
 * Gets next event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {{ nextEvent: OntimeRundownEntry | null; nextIndex: number | null } }
 */
export function getNext(
  rundown: OntimeRundownEntry[],
  currentId: string,
): { nextEvent: OntimeRundownEntry | null; nextIndex: number | null } {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index !== -1 && index + 1 < rundown.length) {
    const nextIndex = index + 1;
    const nextEvent = rundown[nextIndex];
    return { nextEvent, nextIndex };
  } else {
    return { nextEvent: null, nextIndex: null };
  }
}

/**
 * Gets next scheduled event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {{ nextEvent: OntimeEvent | null; nextIndex: number | null } }
 */
export function getNextEvent(
  rundown: OntimeRundownEntry[],
  currentId: string,
): { nextEvent: OntimeEvent | null; nextIndex: number | null } {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index < 0) {
    return { nextEvent: null, nextIndex: null };
  }

  for (let i = index + 1; i < rundown.length; i++) {
    const nextEvent = rundown[i];
    if (isOntimeEvent(nextEvent)) {
      return { nextEvent, nextIndex: i };
    }
  }
  return { nextEvent: null, nextIndex: null };
}

/**
 * Gets previous event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {{ previousEvent: OntimeRundownEntry | null; previousIndex: number | null } }
 */
export function getPrevious(
  rundown: OntimeRundownEntry[],
  currentId: string,
): { previousEvent: OntimeRundownEntry | null; previousIndex: number | null } {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index !== -1 && index - 1 >= 0) {
    const previousIndex = index - 1;
    const previousEvent = rundown[previousIndex];
    return { previousEvent, previousIndex };
  } else {
    return { previousEvent: null, previousIndex: null };
  }
}

/**
 * Gets previous scheduled event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {{ previousEvent: OntimeRundownEntry | null; previousIndex: number | null } }
 */
export function getPreviousEvent(
  rundown: OntimeRundownEntry[],
  currentId: string,
): { previousEvent: OntimeEvent | null; previousIndex: number | null } {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index < 0) {
    return { previousEvent: null, previousIndex: null };
  }
  for (let i = index - 1; i >= 0; i--) {
    const previousEvent = rundown[i];
    if (isOntimeEvent(previousEvent)) {
      return { previousEvent, previousIndex: i };
    }
  }
  return { previousEvent: null, previousIndex: null };
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
