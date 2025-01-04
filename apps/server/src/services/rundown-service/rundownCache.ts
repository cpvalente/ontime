import {
  CustomField,
  CustomFieldLabel,
  CustomFields,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  isPlayableEvent,
  MaybeNumber,
  OntimeEvent,
  OntimeRundown,
  OntimeRundownEntry,
  PlayableEvent,
} from 'ontime-types';
import {
  generateId,
  insertAtIndex,
  reorderArray,
  swapEventData,
  getTimeFromPrevious,
  isNewLatest,
  customFieldLabelToKey,
} from 'ontime-utils';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { createPatch } from '../../utils/parser.js';
import { apply } from './delayUtils.js';
import { handleCustomField, handleLink, hasChanges, isDataStale } from './rundownCacheUtils.js';

type EventID = string;
type NormalisedRundown = Record<EventID, OntimeRundownEntry>;

let persistedRundown: OntimeRundown = [];
let persistedCustomFields: CustomFields = {};

/**
 * Get the cached rundown without triggering regeneration
 */
export const getPersistedRundown = (): OntimeRundown => persistedRundown;
export const getCustomFields = (): CustomFields => persistedCustomFields;

let normalisedRundown: NormalisedRundown = {};
let order: EventID[] = [];
let revision = 0;

/**
 * all mutating functions will set this value if there is a need for re-generation
 * but will only be cleared by the generate function
 */
let isStale = true;

/** Allows safely setting the stale state without accidentally clearing it */
function setIsStale() {
  isStale = true;
}

let totalDelay = 0;
let totalDuration = 0;
let firstStart: MaybeNumber = null;
let lastEnd: MaybeNumber = null;

let links: Record<EventID, EventID> = {};

/**
 * Object that contains reference of renamed custom fields
 * Used to rename the custom fields in the events
 * @example
 * {
 *  oldLabel: newLabel
 *  lighting: lx
 * }
 */
export const customFieldChangelog = new Map<string, string>();

/**
 * Keep track of which custom fields are used.
 * This will be handy for when we delete custom fields
 */
let assignedCustomFields: Record<CustomFieldLabel, EventID[]> = {};

export async function init(initialRundown: Readonly<OntimeRundown>, customFields: Readonly<CustomFields>) {
  persistedRundown = structuredClone(initialRundown) as OntimeRundown;
  persistedCustomFields = structuredClone(customFields);
  generate();
  await getDataProvider().setRundown(persistedRundown);
  await getDataProvider().setCustomFields(customFields);
}

/**
 * Utility generate cache
 * @private should not be called outside of `rundownCache.ts`
 */
export function generate(
  initialRundown: OntimeRundown = persistedRundown,
  customFields: CustomFields = persistedCustomFields,
) {
  function clearIsStale() {
    isStale = false;
  }

  // we decided to re-write this dataset for every change
  // instead of maintaining logic to update it

  assignedCustomFields = {};
  normalisedRundown = {};
  order = [];
  links = {};
  firstStart = null;
  lastEnd = null;
  totalDuration = 0;
  totalDelay = 0;

  let lastEntry: PlayableEvent | null = null;

  for (let i = 0; i < initialRundown.length; i++) {
    // we assign a reference to the current entry, this will be mutated in place
    const currentEntry = initialRundown[i];

    if (isOntimeEvent(currentEntry)) {
      currentEntry.delay = 0;

      // 1. handle links - mutates updatedEvent
      handleLink(i, initialRundown, currentEntry, links);

      // 2. handle custom fields - mutates updatedEvent
      handleCustomField(customFields, customFieldChangelog, currentEntry, assignedCustomFields);

      // update rundown metadata, it only concerns playable events
      if (isPlayableEvent(currentEntry)) {
        // fist start is always the first event
        if (firstStart === null) {
          firstStart = currentEntry.timeStart;
        }

        const timeFromPrevious: number = getTimeFromPrevious(
          currentEntry.timeStart,
          lastEntry?.timeStart,
          lastEntry?.timeEnd,
          lastEntry?.duration,
        );

        if (timeFromPrevious === 0) {
          // event starts on previous finish, we add its duration
          totalDuration += currentEntry.duration;
        } else if (timeFromPrevious > 0) {
          // event has a gap, we add the gap and the duration
          totalDuration += timeFromPrevious + currentEntry.duration;
        } else if (timeFromPrevious < 0) {
          // there is an overlap, we remove the overlap from the duration
          // ensuring that the sum is not negative (ie: fully overlapped events)
          // NOTE: we add the gap since it is a negative number
          totalDuration += Math.max(currentEntry.duration + timeFromPrevious, 0);
        }

        // remove eventual gaps from the accumulated delay
        // we only affect positive delays (time forwards)
        if (totalDelay > 0 && timeFromPrevious > 0) {
          totalDelay = Math.max(totalDelay - timeFromPrevious, 0);
        }
        // current event delay is the current accumulated delay
        currentEntry.delay = totalDelay;

        // lastEntry is the event with the latest end time
        if (isNewLatest(currentEntry.timeStart, currentEntry.timeEnd, lastEntry?.timeStart, lastEntry?.timeEnd)) {
          lastEntry = currentEntry;
        }
      }
    } else if (isOntimeDelay(currentEntry)) {
      // calculate delays
      // !!! this must happen after handling the links
      totalDelay += currentEntry.duration;
    } else if (isOntimeBlock(currentEntry)) {
      // calculate block - nothing yet
    } else {
      // unknown - type skip it
      // this is needed to get the type guard working when we assign the entry to the rundown
      continue;
    }

    // add id to order
    order.push(currentEntry.id);
    // add entry to rundown
    normalisedRundown[currentEntry.id] = currentEntry;
  }

  lastEnd = lastEntry?.timeEnd ?? null;
  clearIsStale();
  customFieldChangelog.clear();

  //The return value is used for testing
  return { rundown: normalisedRundown, order, links, totalDelay, totalDuration, assignedCustomFields };
}

/** Returns an ID guaranteed to be unique */
export function getUniqueId(): string {
  if (isStale) {
    generate();
  }
  let id = '';
  do {
    id = generateId();
  } while (Object.hasOwn(normalisedRundown, id));
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
  totalDelay: number;
  totalDuration: number;
};

/**
 * Returns the full rundown cache.
 * Will triggering regeneration if data is stale.
 */
export function get(): Readonly<RundownCache> {
  if (isStale) {
    generate();
  }
  return {
    rundown: normalisedRundown,
    order,
    revision,
    totalDelay,
    totalDuration,
  };
}

/**
 * Returns calculated metadata from rundown
 * Will triggering regeneration if data is stale.
 */
export function getMetadata() {
  if (isStale) {
    generate();
  }

  return {
    firstStart,
    lastEnd,
    totalDelay,
    totalDuration,
    revision,
  };
}

type CommonParams = { rundown: OntimeRundown };
type MutationParams<T> = T & CommonParams;
type MutatingReturn = {
  newRundown: OntimeRundown;
  newEvent?: OntimeRundownEntry;
  didMutate: boolean;
};
type MutatingFn<T extends object> = (params: MutationParams<T>) => MutatingReturn;

/**
 * Decorators injects data into mutation
 * ensures order of operations when performing mutations
 */
export function mutateCache<T extends object>(mutation: MutatingFn<T>) {
  function scopedMutation(params: T) {
    const { newEvent, newRundown, didMutate } = mutation({ ...params, rundown: persistedRundown });

    // early return without calling side effects
    if (!didMutate) {
      return { newEvent, newRundown, didMutate };
    }

    revision = revision + 1;
    persistedRundown = newRundown;

    // schedule a non priority cache update
    setImmediate(() => {
      get();
    });

    // defer writing to the database
    setImmediate(async () => {
      await getDataProvider().setRundown(persistedRundown);
    });

    return { newEvent, newRundown, didMutate };
  }

  return scopedMutation;
}

type AddArgs = MutationParams<{ atIndex: number; event: OntimeRundownEntry }>;
/**
 * Add entry to rundown
 */
export function add({ rundown, atIndex, event }: AddArgs): Required<MutatingReturn> {
  const newEvent: OntimeRundownEntry = { ...event };
  const newRundown = insertAtIndex(atIndex, newEvent, rundown);
  setIsStale();
  return { newRundown, newEvent, didMutate: true };
}

type RemoveArgs = MutationParams<{ eventIds: string[] }>;
/**
 * Remove entry to rundown
 */
export function remove({ rundown, eventIds }: RemoveArgs): MutatingReturn {
  const newRundown = rundown.filter((event) => !eventIds.includes(event.id));
  const didMutate = rundown.length !== newRundown.length;
  if (didMutate) setIsStale();
  return { newRundown, didMutate };
}

export function removeAll(): MutatingReturn {
  setIsStale();
  return { newRundown: [], didMutate: true };
}

/**
 * Utility function for patching an existing event with new data
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
/**
 * Apply patch to an entry with given id
 */
export function edit({ rundown, eventId, patch }: EditArgs): Required<MutatingReturn> {
  const indexAt = rundown.findIndex((event) => event.id === eventId);
  if (indexAt < 0) {
    throw new Error('Event not found');
  }

  if (patch?.type && rundown[indexAt].type !== patch.type) {
    throw new Error('Invalid event type');
  }

  const eventInMemory = rundown[indexAt];

  if (!hasChanges(eventInMemory, patch)) {
    return { newRundown: rundown, newEvent: eventInMemory, didMutate: false };
  }

  const newEvent = makeEvent(eventInMemory, patch);

  const newRundown = [...rundown];
  newRundown[indexAt] = newEvent;

  // check whether the data warrants recalculation of cache
  const makeStale = isDataStale(patch);

  if (makeStale) {
    setIsStale();
  } else {
    normalisedRundown[newEvent.id] = newEvent;
  }

  return { newRundown, newEvent, didMutate: true };
}

type BatchEditArgs = MutationParams<{ eventIds: string[]; patch: Partial<OntimeRundownEntry> }>;
/**
 * Apply patch to multiple entries
 */
export function batchEdit({ rundown, eventIds, patch }: BatchEditArgs): MutatingReturn {
  const ids = new Set(eventIds);

  const newRundown = [];
  for (let i = 0; i < rundown.length; i++) {
    if (ids.has(rundown[i].id)) {
      if (patch?.type && rundown[i].type !== patch.type) {
        continue;
      }
      const newEvent = makeEvent(rundown[i], patch);
      newRundown.push(newEvent);
    } else {
      newRundown.push(rundown[i]);
    }
  }
  setIsStale();
  return { newRundown, didMutate: true };
}

type ReorderArgs = MutationParams<{ eventId: string; from: number; to: number }>;
/**
 * Redorder two entries
 */
export function reorder({ rundown, eventId, from, to }: ReorderArgs): Required<MutatingReturn> {
  const event = rundown[from];
  if (!event || eventId !== event.id) {
    throw new Error('Event not found');
  }

  const newRundown = reorderArray(rundown, from, to);
  for (let i = from; i <= to; i++) {
    const event = newRundown.at(i);
    if (isOntimeEvent(event)) {
      event.revision += 1;
    }
  }
  setIsStale();
  return { newRundown, newEvent: newRundown.at(from) as OntimeRundownEntry, didMutate: true };
}

type ApplyDelayArgs = MutationParams<{ eventId: string }>;
/**
 * Apply a delay
 */
export function applyDelay({ rundown, eventId }: ApplyDelayArgs): MutatingReturn {
  const newRundown = apply(eventId, rundown);
  setIsStale();
  return { newRundown, didMutate: true };
}

type SwapArgs = MutationParams<{ fromId: string; toId: string }>;
/**
 * Swap two entries
 */
export function swap({ rundown, fromId, toId }: SwapArgs): MutatingReturn {
  const indexA = rundown.findIndex((event) => event.id === fromId);
  const eventA = rundown.at(indexA);

  const indexB = rundown.findIndex((event) => event.id === toId);
  const eventB = rundown.at(indexB);

  if (!isOntimeEvent(eventA) || !isOntimeEvent(eventB)) {
    throw new Error('Swap only available for OntimeEvents');
  }

  const { newA, newB } = swapEventData(eventA, eventB);
  const newRundown = [...rundown];

  newRundown[indexA] = newA;
  (newRundown[indexA] as OntimeEvent).revision += 1;
  newRundown[indexB] = newB;
  (newRundown[indexB] as OntimeEvent).revision += 1;

  setIsStale();
  return { newRundown, didMutate: true };
}

/**
 * Utility for invalidating service cache if a custom field is used
 */
function invalidateIfUsed(label: CustomFieldLabel) {
  if (label in assignedCustomFields) {
    setIsStale();
  }
  // if the field was in use, we mark the cache as stale
  if (label in assignedCustomFields) {
    setIsStale();
  }
  // ... and schedule a cache update
  // schedule a non priority cache update
  setImmediate(async () => {
    generate();
    await getDataProvider().setRundown(persistedRundown);
  });
}

/**
 * Utility for scheduling a non priority custom field persist
 */
function scheduleCustomFieldPersist() {
  setImmediate(async () => {
    await getDataProvider().setCustomFields(persistedCustomFields);
  });
}

/**
 * Sanitises and creates a custom field in the database
 */
export function createCustomField(field: CustomField): CustomFields {
  const { label, type, colour } = field;
  const key = customFieldLabelToKey(label);

  if (key === null) {
    throw new Error('Unable to convert label to a valid key');
  }

  // check if label already exists
  const alreadyExists = Object.hasOwn(persistedCustomFields, key);

  if (alreadyExists) {
    throw new Error('Label already exists');
  }

  // update object and persist
  persistedCustomFields[key] = { label, type, colour };

  scheduleCustomFieldPersist();

  return persistedCustomFields;
}

/**
 * Edits an existing custom field in the database
 */
export function editCustomField(key: string, newField: Partial<CustomField>): CustomFields {
  if (!(key in persistedCustomFields)) {
    throw new Error('Could not find label');
  }

  const existingField = persistedCustomFields[key];
  if (newField.type !== undefined && existingField.type !== newField.type) {
    throw new Error('Change of field type is not allowed');
  }

  if (newField.label === undefined) {
    throw new Error('Missing label');
  }

  const newKey = customFieldLabelToKey(newField.label);
  if (newKey === null) {
    throw new Error('Unable to convert label to a valid key');
  }
  persistedCustomFields[newKey] = { ...existingField, ...newField };

  if (key !== newKey) {
    delete persistedCustomFields[key];
    customFieldChangelog.set(key, newKey);
  }

  scheduleCustomFieldPersist();
  invalidateIfUsed(key);

  return persistedCustomFields;
}

/**
 * Deletes a custom field from the database
 */
export function removeCustomField(label: string): CustomFields {
  if (label in persistedCustomFields) {
    delete persistedCustomFields[label];
  }

  scheduleCustomFieldPersist();
  invalidateIfUsed(label);

  return persistedCustomFields;
}
