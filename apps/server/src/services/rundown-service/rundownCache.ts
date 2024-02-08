import {
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeEvent,
  OntimeRundown,
  OntimeRundownEntry,
} from 'ontime-types';
import {
  generateId,
  deleteAtIndex,
  insertAtIndex,
  reorderArray,
  swapEventData,
  getLinkedTimes,
  formatFromMillis,
} from 'ontime-utils';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { createPatch } from '../../utils/parser.js';
import { apply } from './delayUtils.js';

type EventID = string;
type NormalisedRundown = Record<EventID, OntimeRundownEntry>;

let persistedRundown: OntimeRundown = [];
/** Utility function gets rundown from DataProvider */
export const getPersistedRundown = (): OntimeRundown => persistedRundown;

let rundown: NormalisedRundown = {};
let order: EventID[] = [];
let revision = 0;
let isStale = true;

let links: Record<EventID, EventID> = {};

export async function init(initialRundown: OntimeRundown) {
  persistedRundown = structuredClone(initialRundown);
  generate();
  await DataProvider.setRundown(persistedRundown);
}

/**
 * Utility initialises cache
 * @param rundown
 */
export function generate(initialRundown: OntimeRundown = persistedRundown) {
  // we decided to re-write this dataset for every change
  // instead of maintaining logic to update it

  function getLink(currentIndex: number): OntimeEvent | null {
    // currently the link is the previous event
    for (let i = currentIndex - 1; i >= 0; i--) {
      const event = initialRundown[i];
      if (isOntimeEvent(event)) {
        return event;
      }
    }
    return null;
  }

  rundown = {};
  order = [];
  links = {};

  let accumulatedDelay = 0;
  for (let i = 0; i < initialRundown.length; i++) {
    const currentEvent = initialRundown[i];
    let updatedEvent = { ...currentEvent };

    // handle links
    if (isOntimeEvent(updatedEvent)) {
      if (updatedEvent.linkStart) {
        const linkedEvent = getLink(i);
        // link is always the previous event for now
        if (linkedEvent) {
          links[linkedEvent.id] = currentEvent.id;

          const timePatch = getLinkedTimes(updatedEvent, linkedEvent);
          updatedEvent = { ...updatedEvent, ...timePatch };
        } else {
          updatedEvent.linkStart = null;
        }
        // update the persisted event
        initialRundown[i] = updatedEvent;
      }
    }

    // calculate delays
    if (isOntimeDelay(updatedEvent)) {
      accumulatedDelay += updatedEvent.duration;
    } else if (isOntimeBlock(updatedEvent)) {
      accumulatedDelay = 0;
    } else if (isOntimeEvent(updatedEvent)) {
      updatedEvent.delay = accumulatedDelay;
    }

    order.push(updatedEvent.id);
    rundown[updatedEvent.id] = { ...updatedEvent };
  }

  isStale = false;
  return { rundown, order, links };
}

/** Returns an ID guaranteed to be unique */
export function getUniqueId(): string {
  if (isStale) {
    generate();
  }
  let id = '';
  do {
    id = generateId();
  } while (Object.hasOwn(rundown, id));
  return id;
}

/** Returns index of an event with a given id */
export function getIndexOf(eventId: string) {
  if (isStale) {
    generate();
  }
  return order.indexOf(eventId);
}

type RundownCache = {
  rundown: NormalisedRundown;
  order: string[];
  revision: number;
};

/**
 * Returns cached data
 * @returns {RundownCache}
 */
export function get(): Readonly<RundownCache> {
  if (isStale) {
    console.time('rundownCache__init');
    generate();
    console.timeEnd('rundownCache__init');
  }
  return {
    rundown,
    order,
    revision,
  };
}

type CommonParams = { persistedRundown: OntimeRundown };
type MutationParams<T> = T & CommonParams;
type MutatingReturn = {
  newRundown: OntimeRundown;
  newEvent?: OntimeRundownEntry;
};
type MutatingFn<T extends object> = (params: MutationParams<T>) => MutatingReturn;
/**
 * Decorators injects data into mutation
 * @param mutation
 * @returns
 */
export function mutateCache<T extends object>(mutation: MutatingFn<T>) {
  async function scopedMutation(params: T) {
    const { newEvent, newRundown } = mutation({ ...params, persistedRundown });

    revision = revision + 1;
    isStale = true;
    persistedRundown = newRundown;

    // schedule a non priority cache update
    setImmediate(() => {
      console.time('rundownCache__init');
      generate();
      console.timeEnd('rundownCache__init');
    });

    // TODO: should we trottle this?
    // defer writing to the database
    setImmediate(() => {
      DataProvider.setRundown(persistedRundown);
    });

    // TODO: could we return a patch object?
    return { newEvent };
  }
  return scopedMutation;
}

type AddArgs = MutationParams<{ atIndex: number; event: OntimeRundownEntry }>;
export function add({ persistedRundown, atIndex, event }: AddArgs): Required<MutatingReturn> {
  const newEvent: OntimeRundownEntry = { ...event };
  const newRundown = insertAtIndex(atIndex, newEvent, persistedRundown);

  return { newRundown, newEvent };
}

type RemoveArgs = MutationParams<{ eventId: string }>;
export function remove({ persistedRundown, eventId }: RemoveArgs): MutatingReturn {
  const atIndex = persistedRundown.findIndex((event) => event.id === eventId);
  const newRundown = deleteAtIndex(atIndex, persistedRundown);

  return { newRundown };
}

export function removeAll(): { newRundown: OntimeRundown } {
  return { newRundown: [] };
}

/**
 * Utility function for patching events
 * @param eventFromRundown
 * @param patch
 * @returns
 */
function makeEvent(eventFromRundown: OntimeRundownEntry, patch: Partial<OntimeRundownEntry>): OntimeRundownEntry {
  if (isOntimeEvent(eventFromRundown)) {
    const newEvent = createPatch(eventFromRundown, patch as OntimeEvent);
    newEvent.revision++;
    return newEvent;
  }
  // TODO: exhaustive check
  return { ...eventFromRundown, ...patch } as OntimeRundownEntry;
}

type EditArgs = MutationParams<{ eventId: string; patch: Partial<OntimeRundownEntry> }>;
export function edit({ persistedRundown, eventId, patch }: EditArgs): Required<MutatingReturn> {
  const indexAt = persistedRundown.findIndex((event) => event.id === eventId);

  if (indexAt < 0) {
    throw new Error('Event not found');
  }

  if (patch?.type && persistedRundown[indexAt].type !== patch.type) {
    throw new Error('Invalid event type');
  }

  // @ts-expect-error -- testing
  console.log('patch', formatFromMillis(patch?.timeStart ?? 0, 'HH:mm:ss'));

  const eventInMemory = persistedRundown[indexAt];
  const newEvent = makeEvent(eventInMemory, patch);

  const newRundown = [...persistedRundown];
  newRundown[indexAt] = newEvent;

  return { newRundown, newEvent };
}

type BatchEditArgs = MutationParams<{ eventIds: string[]; patch: Partial<OntimeRundownEntry> }>;
export function batchEdit({ persistedRundown, eventIds, patch }: BatchEditArgs): MutatingReturn {
  const ids = new Set(eventIds);

  const newRundown = [];
  for (let i = 0; i < persistedRundown.length; i++) {
    if (ids.has(persistedRundown[i].id)) {
      if (patch?.type && persistedRundown[i].type !== patch.type) {
        continue;
      }
      const newEvent = makeEvent(persistedRundown[i], patch);
      newRundown.push(newEvent);
    } else {
      newRundown.push(persistedRundown[i]);
    }
  }
  return { newRundown };
}

type ReorderArgs = MutationParams<{ eventId: string; from: number; to: number }>;
export function reorder({ persistedRundown, eventId, from, to }: ReorderArgs): Required<MutatingReturn> {
  const event = persistedRundown[from];
  if (!event || eventId !== event.id) {
    throw new Error('Event not found');
  }

  // TODO: what is the behaviour on reordering
  const newRundown = reorderArray(persistedRundown, from, to);
  for (let i = from; i <= to; i++) {
    const event = newRundown.at(i);
    if (isOntimeEvent(event)) {
      event.revision += 1;
    }
  }
  return { newRundown, newEvent: newRundown.at(from) };
}

type ApplyDelayArgs = MutationParams<{ eventId: string }>;
export function applyDelay({ persistedRundown, eventId }: ApplyDelayArgs): MutatingReturn {
  const newRundown = apply(eventId, persistedRundown);
  return { newRundown };
}

type SwapArgs = MutationParams<{ fromId: string; toId: string }>;
export function swap({ persistedRundown, fromId, toId }: SwapArgs): MutatingReturn {
  const indexA = persistedRundown.findIndex((event) => event.id === fromId);
  const eventA = persistedRundown.at(indexA);

  const indexB = persistedRundown.findIndex((event) => event.id === toId);
  const eventB = persistedRundown.at(indexB);

  if (!isOntimeEvent(eventA) || !isOntimeEvent(eventB)) {
    throw new Error('Swap only available for OntimeEvents');
  }

  const { newA, newB } = swapEventData(eventA, eventB);
  const newRundown = [...persistedRundown];

  newRundown[indexA] = newA;
  (newRundown[indexA] as OntimeEvent).revision += 1;
  newRundown[indexB] = newB;
  (newRundown[indexB] as OntimeEvent).revision += 1;

  return { newRundown };
}
