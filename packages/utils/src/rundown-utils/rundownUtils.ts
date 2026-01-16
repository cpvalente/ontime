import type {
  EntryId,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  PlayableEvent,
  Rundown,
  RundownEntries,
} from 'ontime-types';
import { isOntimeEvent, isOntimeGroup, isPlayableEvent } from 'ontime-types';

type IndexAndEntry = { entry: OntimeEntry | null; index: number | null };
type GroupIndexAndEntry = { entry: OntimeGroup | null; index: number | null };

/**
 * Gets first event in a normalised rundown, if it exists
 */
export function getFirstNormal(entries: RundownEntries, order: EntryId[]): OntimeEntry | null {
  if (!order.length) {
    return null;
  }
  const eventId = order[0];
  return entries[eventId] ?? null;
}

/**
 * Gets first scheduled event in rundown, if it exists
 */
export function getFirstEvent(rundown: OntimeEntry[]): {
  firstEvent: PlayableEvent | null;
  firstIndex: number | null;
} {
  for (let i = 0; i < rundown.length; i++) {
    const firstEvent = rundown[i];
    if (isOntimeEvent(firstEvent) && isPlayableEvent(firstEvent)) {
      return { firstEvent, firstIndex: i };
    }
  }
  return { firstEvent: null, firstIndex: null };
}

/**
 * Gets first scheduled event in a normalised rundown, if it exists
 */
export function getFirstEventNormal(
  rundown: RundownEntries,
  order: EntryId[],
): {
  firstEvent: PlayableEvent | null;
  firstIndex: number | null;
} {
  for (let i = 0; i < order.length; i++) {
    const firstId = order[i];
    const firstEvent = rundown[firstId];
    if (isOntimeEvent(firstEvent) && isPlayableEvent(firstEvent)) {
      return { firstEvent, firstIndex: i };
    }
  }
  return { firstEvent: null, firstIndex: null };
}

/**
 * Gets last event in a normalised rundown, if it exists
 */
export function getLastNormal(entries: RundownEntries, order: EntryId[]): OntimeEntry | null {
  const lastId = order.at(-1);
  if (lastId === undefined) {
    return null;
  }
  return entries[lastId] ?? null;
}

/**
 * Gets last scheduled event in rundown, if it exists
 */
export function getLastEvent(rundown: OntimeEntry[]): {
  lastEvent: PlayableEvent | null;
  lastIndex: number | null;
} {
  if (rundown.length < 1) {
    return { lastEvent: null, lastIndex: null };
  }

  for (let i = rundown.length - 1; i >= 0; i--) {
    const lastEvent = rundown[i];
    if (isOntimeEvent(lastEvent) && isPlayableEvent(lastEvent)) {
      return { lastEvent, lastIndex: i };
    }
  }
  return { lastEvent: null, lastIndex: null };
}

/**
 * Gets last scheduled event in a normalised rundown, if it exists
 */
export function getLastEventNormal(
  rundown: RundownEntries,
  order: EntryId[],
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
 */
export function getNext(
  rundown: Pick<Rundown, 'entries' | 'order'>,
  currentId: EntryId,
): { nextEvent: OntimeEntry | null; nextIndex: number | null } {
  const index = rundown.order.findIndex((entryId) => entryId === currentId);
  if (index !== -1 && index + 1 < rundown.order.length) {
    const nextIndex = index + 1;
    const nextId = rundown.order[nextIndex];
    const nextEvent = rundown.entries[nextId];
    return { nextEvent, nextIndex };
  } else {
    return { nextEvent: null, nextIndex: null };
  }
}

/**
 * Gets next entry in rundown, if it exists
 */
export function getNextNormal(rundown: RundownEntries, flatOrder: EntryId[], currentId: EntryId | null): IndexAndEntry {
  if (currentId === null) {
    const entry = getFirstNormal(rundown, flatOrder);
    return { entry, index: entry ? 0 : null };
  }

  const currentIndex = flatOrder.findIndex((id) => id === currentId);
  if (currentIndex !== -1 && currentIndex + 1 < flatOrder.length) {
    const index = currentIndex + 1;
    const nextId = flatOrder[index];
    const entry = rundown[nextId];
    return { entry, index };
  }
  return { entry: null, index: null };
}

/**
 * Gets next scheduled event in rundown, if it exists
 */
export function getNextEvent(
  rundown: OntimeEntry[],
  currentId: EntryId,
): { nextEvent: OntimeEvent | null; nextIndex: number | null } {
  const index = rundown.findIndex((entry) => entry.id === currentId);
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
 */
export function getNextEventNormal(
  entries: RundownEntries,
  order: EntryId[],
  currentId: EntryId,
): { nextEvent: OntimeEvent | null; nextIndex: number | null } {
  const index = order.findIndex((entryId) => entryId === currentId);
  if (index < 0) {
    return { nextEvent: null, nextIndex: null };
  }

  for (let i = index + 1; i < order.length; i++) {
    const nextId = order[i];
    const nextEvent = entries[nextId];
    if (isOntimeEvent(nextEvent)) {
      return { nextEvent, nextIndex: i };
    }
  }
  return { nextEvent: null, nextIndex: null };
}

/**
 * Gets previous entry in rundown, if it exists
 */
export function getPrevious(rundown: Pick<Rundown, 'entries' | 'order'>, currentId: EntryId): IndexAndEntry {
  const currentIndex = rundown.order.findIndex((entryId) => entryId === currentId);

  if (currentIndex > 1) {
    const index = currentIndex - 1;
    const previousId = rundown.order[index];
    const entry = rundown.entries[previousId];
    return { entry, index };
  } else {
    return { entry: null, index: null };
  }
}

/**
 * Gets previous entry in a normalised rundown, if it exists
 */
export function getPreviousNormal(
  entries: RundownEntries,
  flatOrder: EntryId[],
  currentId: EntryId | null,
): IndexAndEntry {
  if (currentId === null) {
    const entry = getLastNormal(entries, flatOrder);
    return { entry, index: entry ? flatOrder.length - 1 : null };
  }

  const currentIndex = flatOrder.findIndex((id) => id === currentId);
  if (currentIndex !== -1 && currentIndex - 1 >= 0) {
    const index = currentIndex - 1;
    const previousId = flatOrder[index];
    const entry = entries[previousId];
    return { entry, index };
  }
  return { entry: null, index: null };
}

/**
 * Gets first group in a normalised rundown, if it exists
 */
export function getFirstGroupNormal(entries: RundownEntries, flatOrder: EntryId[]): GroupIndexAndEntry {
  for (let index = 0; index < flatOrder.length; index++) {
    const id = flatOrder[index];
    const entry = entries[id];
    if (isOntimeGroup(entry)) {
      return { entry, index };
    }
  }
  return { entry: null, index: null };
}

/**
 * Gets last group in a normalised rundown, if it exists
 */
export function getLastGroupNormal(entries: RundownEntries, flatOrder: EntryId[]): GroupIndexAndEntry {
  for (let index = flatOrder.length - 1; index >= 0; index--) {
    const id = flatOrder[index];
    const entry = entries[id];
    if (isOntimeGroup(entry)) {
      return { entry, index };
    }
  }
  return { entry: null, index: null };
}

/**
 * Gets previous scheduled event in rundown, if it exists
 */
export function getPreviousEvent(
  rundown: Pick<Rundown, 'entries' | 'order'>,
  currentId: EntryId,
): { previousEvent: OntimeEvent | null; previousIndex: number | null } {
  const index = rundown.order.findIndex((entryId) => entryId === currentId);
  if (index < 0) {
    return { previousEvent: null, previousIndex: null };
  }
  for (let i = index - 1; i >= 0; i--) {
    const previousId = rundown.order[i];
    const previousEvent = rundown.entries[previousId];
    if (isOntimeEvent(previousEvent)) {
      return { previousEvent, previousIndex: i };
    }
  }
  return { previousEvent: null, previousIndex: null };
}

/**
 * Gets previous scheduled event in a normalised rundown, if it exists
 */
export function getPreviousEventNormal(
  entries: RundownEntries,
  order: EntryId[],
  currentId: EntryId,
): { previousEvent: OntimeEvent | null; previousIndex: number | null } {
  const index = order.findIndex((entryId) => entryId === currentId);
  if (index < 0) {
    return { previousEvent: null, previousIndex: null };
  }
  for (let i = index - 1; i >= 0; i--) {
    const previousId = order[i];
    const previousEvent = entries[previousId];
    if (isOntimeEvent(previousEvent)) {
      return { previousEvent, previousIndex: i };
    }
  }
  return { previousEvent: null, previousIndex: null };
}

/**
 * @description swaps two OntimeEvents in the rundown
 */
export const swapEventData = (eventA: OntimeEvent, eventB: OntimeEvent): [newA: OntimeEvent, newB: OntimeEvent] => {
  const newA = {
    ...eventB,
    // events keep the ID
    id: eventA.id,
    // events keep the schedule
    timeStart: eventA.timeStart,
    timeEnd: eventA.timeEnd,
    duration: eventA.duration,
    linkStart: eventA.linkStart,
    parent: eventA.parent,
    // keep schedule metadata
    delay: eventA.delay,
    gap: eventA.gap,
    dayOffset: eventA.dayOffset,
    // keep revision number
    revision: eventA.revision,
  };

  const newB = {
    ...eventA,
    // events keep the ID
    id: eventB.id,
    // events keep the schedule
    timeStart: eventB.timeStart,
    timeEnd: eventB.timeEnd,
    duration: eventB.duration,
    linkStart: eventB.linkStart,
    parent: eventB.parent,
    // keep schedule metadata
    delay: eventB.delay,
    gap: eventB.gap,
    dayOffset: eventB.dayOffset,
    // keep revision number
    revision: eventB.revision,
  };

  return [newA, newB];
};

export function getEventWithId(rundown: OntimeEntry[], id: EntryId): OntimeEntry | undefined {
  return rundown.find((event) => event.id === id);
}

/**
 * Gets relevant group element for a given ID
 */
export function getPreviousGroupNormal(
  rundown: RundownEntries,
  flatOrder: EntryId[],
  currentId: EntryId | null,
): IndexAndEntry {
  if (currentId === null) {
    return getLastGroupNormal(rundown, flatOrder);
  }

  let foundCurrentEvent = false;
  // Iterate backwards through the rundown to find the current event
  for (let index = flatOrder.length - 1; index >= 0; index--) {
    const id = flatOrder[index];
    if (!foundCurrentEvent && id === currentId) {
      // set the flag when the current event is found
      foundCurrentEvent = true;
      continue;
    }
    // the first group before the current event is the relevant one
    const entry = rundown[id];
    if (foundCurrentEvent && isOntimeGroup(entry)) {
      return { entry, index };
    }
  }
  // no groups exist before current event
  return { entry: null, index: null };
}

/**
 * Gets next group element for a given ID
 */
export function getNextGroupNormal(
  rundown: RundownEntries,
  flatOrder: EntryId[],
  currentId: EntryId | null,
): IndexAndEntry {
  if (currentId === null) {
    return getFirstGroupNormal(rundown, flatOrder);
  }

  let foundCurrentEvent = false;
  // Iterate backwards through the rundown to find the current event
  for (let index = 0; index < flatOrder.length; index++) {
    const id = flatOrder[index];
    if (!foundCurrentEvent && id === currentId) {
      // set the flag when the current event is found
      foundCurrentEvent = true;
      continue;
    }
    // the first group before the current event is the relevant one
    const entry = rundown[id];
    if (foundCurrentEvent && isOntimeGroup(entry)) {
      return { entry, index };
    }
  }
  // no groups exist before current event
  return { entry: null, index: null };
}

/**
 * Gets relevant group element for a given ID
 */
export function getPreviousGroup(rundown: Pick<Rundown, 'entries' | 'order'>, currentId: EntryId): OntimeGroup | null {
  const currentEvent = rundown.entries[currentId];

  // check if entry is inside a group
  if ('parent' in currentEvent && currentEvent.parent) {
    return rundown.entries[currentEvent.parent] as OntimeGroup;
  }

  let foundCurrentEvent = false;
  // Iterate backwards through the rundown to find the current event
  for (let i = rundown.order.length - 1; i >= 0; i--) {
    const entryId = rundown.order[i];
    const entry = rundown.entries[entryId];
    if (!foundCurrentEvent && entry.id === currentId) {
      // set the flag when the current event is found
      foundCurrentEvent = true;
      continue;
    }
    // the first group before the current event is the relevant one
    if (foundCurrentEvent && isOntimeGroup(entry)) {
      return entry;
    }
  }
  // no groups exist before null event
  return null;
}
