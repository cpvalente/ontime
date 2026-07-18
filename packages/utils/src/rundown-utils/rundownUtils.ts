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

import { insertAtIndex } from '../common/arrayUtils.js';

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

export function getInsertAfterId(
  rundown: Rundown,
  parent: OntimeGroup | null,
  afterId?: EntryId | true,
  beforeId?: EntryId | true,
): EntryId | null {
  if (beforeId) {
    const insertionList = parent ? parent.entries : rundown.order;
    return beforeId === true ? (insertionList[0] ?? null) : beforeId;
  }

  if (afterId) return afterId === true ? null : afterId;

  return null;
}

type ResolveInsertParentOptions = {
  parent?: EntryId | null;
  after?: EntryId | true;
  before?: EntryId | true;
};

/**
 * Resolves the parent ID for an insertion.
 * Uses explicit parent first, then infers from sibling references.
 */
export function resolveInsertParent(rundown: Rundown, options: ResolveInsertParentOptions): EntryId | null {
  // 1. if we have a parent reference we return that
  if (options.parent !== undefined && options.parent !== null) {
    return options.parent;
  }

  // 2. ... otherwise we look for a sibling and get their parent
  const referenceId = (() => {
    if (typeof options.after === 'string') return options.after;
    if (typeof options.before === 'string') return options.before;
    return undefined;
  })();
  if (referenceId === undefined) return null;

  const maybeSibling = rundown.entries[referenceId];
  if (maybeSibling !== undefined && 'parent' in maybeSibling && maybeSibling.parent !== null) {
    return maybeSibling.parent;
  }

  return null;
}

/**
 * Add entry to rundown, mutates the rundown in place.
 * if afterId and beforeId are not provided, we add at the end of the rundown
 */
export function addToRundown(
  rundown: Rundown,
  entry: OntimeEntry,
  parent: OntimeGroup | null,
  afterId: EntryId | null,
  beforeId: EntryId | null,
): OntimeEntry {
  // which list to use, the top level or a group order
  const insertionList = parent ? parent.entries : rundown.order;

  // the index inside the list
  const insertionIndex = (() => {
    if (beforeId) return insertionList.indexOf(beforeId);
    if (afterId) return insertionList.indexOf(afterId) + 1;
    return insertionList.length;
  })();

  // the index inside the flat order
  const flatIndex = (() => {
    if (beforeId) return rundown.flatOrder.indexOf(beforeId);

    if (afterId) {
      const afterEntry = rundown.entries[afterId];
      const flatReferenceId =
        !parent && isOntimeGroup(afterEntry) && afterEntry.entries?.length > 0
          ? afterEntry.entries[afterEntry.entries.length - 1]
          : afterId;
      return rundown.flatOrder.indexOf(flatReferenceId) + 1;
    }

    if (parent) {
      const previousId = insertionList[insertionIndex - 1] ?? parent.id;
      return rundown.flatOrder.indexOf(previousId) + 1;
    }

    return rundown.flatOrder.length;
  })();

  if (parent) {
    if (isOntimeGroup(entry)) {
      throw new Error('Cannot add a group to another group');
    }

    entry.parent = parent.id;
    parent.entries = insertAtIndex(insertionIndex, entry.id, parent.entries);
  } else {
    rundown.order = insertAtIndex(insertionIndex, entry.id, rundown.order);
  }
  rundown.flatOrder = insertAtIndex(flatIndex, entry.id, rundown.flatOrder);

  // either way, we register the entry in the entries map
  rundown.entries[entry.id] = entry;
  return entry;
}
