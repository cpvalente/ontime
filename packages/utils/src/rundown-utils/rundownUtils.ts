import type { NormalisedRundown, OntimeBlock, OntimeEvent, OntimeRundown, OntimeRundownEntry } from 'ontime-types';
import { isOntimeBlock, isOntimeEvent } from 'ontime-types';

type IndexAndEntry = { entry: OntimeRundownEntry | null; index: number | null };

/**
 * Gets first event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @return {OntimeRundownEntry | null}
 */
export function getFirst(rundown: OntimeRundownEntry[]) {
  return rundown.length ? rundown[0] : null;
}

/**
 * Gets first event in a normalised rundown, if it exists
 * @param rundown
 * @param order
 * @returns
 */
export function getFirstNormal(rundown: NormalisedRundown, order: string[]) {
  const firstId = order[0];
  return rundown[firstId] ?? null;
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
    if (isOntimeEvent(firstEvent) && !firstEvent.skip) {
      return { firstEvent, firstIndex: i };
    }
  }
  return { firstEvent: null, firstIndex: null };
}

/**
 * Gets first scheduled event in a normalised rundown, if it exists
 * @param rundown
 * @param order
 * @returns
 */
export function getFirstEventNormal(
  rundown: NormalisedRundown,
  order: string[],
): {
  firstEvent: OntimeEvent | null;
  firstIndex: number | null;
} {
  for (let i = 0; i < order.length; i++) {
    const firstId = order[i];
    const firstEvent = rundown[firstId];
    if (isOntimeEvent(firstEvent) && !firstEvent.skip) {
      return { firstEvent, firstIndex: i };
    }
  }
  return { firstEvent: null, firstIndex: null };
}

/**
 * Gets last event in a normalised rundown, if it exists
 * @param rundown
 * @param order
 * @returns
 */
export function getLastNormal(rundown: NormalisedRundown, order: string[]): OntimeRundownEntry | null {
  const lastId = order.at(-1);
  if (lastId === undefined) {
    return null;
  }
  return rundown[lastId] ?? null;
}

/**
 * Gets last scheduled event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @return {{ firstEvent: OntimeEvent | null; firstIndex: number | null } }
 */
export function getLastEvent(rundown: OntimeRundown): {
  lastEvent: OntimeEvent | null;
  lastIndex: number | null;
} {
  if (rundown.length < 1) {
    return { lastEvent: null, lastIndex: null };
  }

  for (let i = rundown.length - 1; i >= 0; i--) {
    const lastEvent = rundown.at(i);
    if (isOntimeEvent(lastEvent) && !lastEvent.skip) {
      return { lastEvent, lastIndex: i };
    }
  }
  return { lastEvent: null, lastIndex: null };
}

/**
 * Gets last scheduled event in a normalised rundown, if it exists
 * @param rundown
 * @param order
 * @return {{ firstEvent: OntimeEvent | null; firstIndex: number | null } }
 */
export function getLastEventNormal(
  rundown: NormalisedRundown,
  order: string[],
): {
  lastEvent: OntimeEvent | null;
  lastIndex: number | null;
} {
  if (order.length < 1) {
    return { lastEvent: null, lastIndex: null };
  }

  for (let i = order.length - 1; i >= 0; i--) {
    const lastId = order[i];
    const lastEvent = rundown[lastId];
    if (isOntimeEvent(lastEvent) && !lastEvent.skip) {
      return { lastEvent, lastIndex: i };
    }
  }
  return { lastEvent: null, lastIndex: null };
}

/**
 * Gets next entry in rundown, if it exists
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
 * Gets next entry in rundown, if it exists
 * @param rundown
 * @param order
 * @param currentId
 * @returns
 */
export function getNextNormal(rundown: NormalisedRundown, order: string[], currentId: string): IndexAndEntry {
  const currentIndex = order.findIndex((id) => id === currentId);
  if (currentIndex !== -1 && currentIndex + 1 < order.length) {
    const index = currentIndex + 1;
    const nextId = order[index];
    const entry = rundown[nextId];
    return { entry, index };
  } else {
    return { entry: null, index: null };
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
 * Gets next scheduled event in a normalised rundown, if it exists
 * @param rundown
 * @param order
 * @param {string} currentId
 * @return {{ nextEvent: OntimeEvent | null; nextIndex: number | null } }
 */
export function getNextEventNormal(
  rundown: NormalisedRundown,
  order: string[],
  currentId: string,
): { nextEvent: OntimeEvent | null; nextIndex: number | null } {
  const index = order.findIndex((id) => id === currentId);
  if (index < 0) {
    return { nextEvent: null, nextIndex: null };
  }

  for (let i = index + 1; i < order.length; i++) {
    const nextId = order[i];
    const nextEvent = rundown[nextId];
    if (isOntimeEvent(nextEvent)) {
      return { nextEvent, nextIndex: i };
    }
  }
  return { nextEvent: null, nextIndex: null };
}

/**
 * Gets previous entry in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 */
export function getPrevious(rundown: OntimeRundownEntry[], currentId: string): IndexAndEntry {
  const currentIndex = rundown.findIndex((event) => event.id === currentId);
  if (currentIndex !== -1 && currentIndex - 1 >= 0) {
    const index = currentIndex - 1;
    const entry = rundown[index];
    return { entry, index };
  } else {
    return { entry: null, index: null };
  }
}

/**
 * Gets previous entry in a nornalised rundown, if it exists
 * @param rundown
 * @param order
 * @param {string} currentId
 */
export function getPreviousNormal(rundown: NormalisedRundown, order: string[], currentId: string): IndexAndEntry {
  const currentIndex = order.findIndex((id) => id === currentId);
  if (currentIndex !== -1 && currentIndex - 1 >= 0) {
    const index = currentIndex - 1;
    const previousId = order[index];
    const entry = rundown[previousId];
    return { entry, index };
  } else {
    return { entry: null, index: null };
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
 * Gets previous scheduled event in a normalised rundown, if it exists
 * @param rundown
 * @param order
 * @param {string} currentId
 * @return {{ previousEvent: OntimeRundownEntry | null; previousIndex: number | null } }
 */
export function getPreviousEventNormal(
  rundown: NormalisedRundown,
  order: string[],
  currentId: string,
): { previousEvent: OntimeEvent | null; previousIndex: number | null } {
  const index = order.findIndex((id) => id === currentId);
  if (index < 0) {
    return { previousEvent: null, previousIndex: null };
  }
  for (let i = index - 1; i >= 0; i--) {
    const previousId = order[i];
    const previousEvent = rundown[previousId];
    if (isOntimeEvent(previousEvent)) {
      return { previousEvent, previousIndex: i };
    }
  }
  return { previousEvent: null, previousIndex: null };
}

/**
 * @description swaps two OntimeEvents in the rundown
 * @param {OntimeEvent} eventA
 * @param {OntimeEvent} eventB
 */
export const swapEventData = (eventA: OntimeEvent, eventB: OntimeEvent): { newA: OntimeEvent; newB: OntimeEvent } => {
  const newA = {
    ...eventB,
    id: eventA.id,
    timeStart: eventA.timeStart,
    timeEnd: eventA.timeEnd,
    duration: eventA.duration,
    delay: eventA.delay,
  };

  const newB = {
    ...eventA,
    id: eventB.id,
    timeStart: eventB.timeStart,
    timeEnd: eventB.timeEnd,
    duration: eventB.duration,
    delay: eventB.delay,
  };

  return { newA, newB };
};

export function getEventWithId(rundown: OntimeRundown, id: string): OntimeRundownEntry | undefined {
  return rundown.find((event) => event.id === id);
}

/**
 * Gets relevant block element for a given ID
 * @param rundown
 * @param order
 * @param {string} currentId
 * @return {OntimeBlock | null}
 */
export function getRelevantBlock(rundown: OntimeRundown, currentId: string): OntimeBlock | null {
  let inBlock = false;
  // Iterate backwards through the rundown to find the current event
  for (let i = rundown.length - 1; i >= 0; i--) {
    const entry = rundown[i];
    if (entry.id === currentId) {
      //set the flag when the current event is found
      inBlock = true;
    }
    //the first block before the current event is the relevant one
    if (inBlock && isOntimeBlock(entry)) {
      return entry;
    }
  }
  //no blocks exist before current event
  return null;
}

/**
 * returns all events that can be loaded
 * @return {array}
 */
export function filterPlayable(rundown: OntimeRundown): OntimeEvent[] {
  return rundown.filter((event) => isOntimeEvent(event) && !event.skip) as OntimeEvent[];
}

/**
 * returns all events of type OntimeEvent
 * @return {array}
 */
export function filterTimedEvents(rundown: OntimeRundown): OntimeEvent[] {
  return rundown.filter((event) => isOntimeEvent(event)) as OntimeEvent[];
}
