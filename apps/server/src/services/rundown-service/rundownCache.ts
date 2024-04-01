import {
  CustomField,
  CustomFieldLabel,
  CustomFields,
  isOntimeDelay,
  isOntimeEvent,
  MaybeNumber,
  OntimeEvent,
  OntimeRundown,
  OntimeRundownEntry,
} from 'ontime-types';
import { generateId, deleteAtIndex, insertAtIndex, reorderArray, swapEventData } from 'ontime-utils';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { createPatch } from '../../utils/parser.js';
import { getTotalDuration } from '../timerUtils.js';
import { apply } from './delayUtils.js';
import { handleCustomField, handleLink, hasChanges, isDataStale } from './rundownCacheUtils.js';

type EventID = string;
type NormalisedRundown = Record<EventID, OntimeRundownEntry>;

let persistedRundown: OntimeRundown = [];
let persistedCustomFields: CustomFields = {};

/** Utility function gets to expose data */
export const getPersistedRundown = (): OntimeRundown => persistedRundown;
export const getCustomFields = (): CustomFields => persistedCustomFields;

let rundown: NormalisedRundown = {};
let order: EventID[] = [];
let revision = 0;
let isStale = true;
let totalDelay = 0;
let totalDuration = 0;
let firstStart: MaybeNumber = null;
let lastEnd: MaybeNumber = null;

let links: Record<EventID, EventID> = {};

/**
 * Object that contains renamings to custom fields
 * Used to rename the custom fields in the events
 * @example
 * {
 *  oldLabel: newLabel
 *  lighting: lx
 * }
 */
const customFieldChangelog = {};

/**
 * Keep track of which custom fields are used.
 * This will be handy for when we delete custom fields
 */
let assignedCustomFields: Record<CustomFieldLabel, EventID[]> = {};

export async function init(initialRundown: Readonly<OntimeRundown>, customFields: Readonly<CustomFields>) {
  persistedRundown = structuredClone(initialRundown) as OntimeRundown;
  persistedCustomFields = structuredClone(customFields);
  generate();
  await DataProvider.setRundown(persistedRundown);
  await DataProvider.setCustomFields(customFields);
}

/**
 * Utility initialises cache
 * @param rundown
 */
export function generate(
  initialRundown: OntimeRundown = persistedRundown,
  customFields: CustomFields = persistedCustomFields,
) {
  // we decided to re-write this dataset for every change
  // instead of maintaining logic to update it

  assignedCustomFields = {};
  rundown = {};
  order = [];
  links = {};
  firstStart = null;
  lastEnd = null;

  let accumulatedDelay = 0;
  let daySpan = 0;
  let previousEnd: number;

  for (let i = 0; i < initialRundown.length; i++) {
    const currentEvent = initialRundown[i];
    const updatedEvent = { ...currentEvent };

    if (isOntimeEvent(updatedEvent)) {
      // 1. handle links
      handleLink(i, initialRundown, updatedEvent, links);

      // 2. handle custom fields
      handleCustomField(customFields, customFieldChangelog, updatedEvent, assignedCustomFields);

      // update the persisted event
      initialRundown[i] = updatedEvent;

      // update rundown duration
      if (firstStart === null) {
        firstStart = updatedEvent.timeStart;
      }
      lastEnd = updatedEvent.timeEnd;

      // check if we go over midnight, account for eventual gaps
      const gapOverMidnight = previousEnd > updatedEvent.timeStart;
      const durationOverMidnight = updatedEvent.timeStart > updatedEvent.timeEnd;
      if (gapOverMidnight || durationOverMidnight) {
        daySpan++;
      }
    }

    // calculate delays
    // !!! this must happen after handling the links
    if (isOntimeDelay(updatedEvent)) {
      accumulatedDelay += updatedEvent.duration;
    } else if (isOntimeEvent(updatedEvent)) {
      const eventStart = updatedEvent.timeStart;

      // we only affect positive delays (time forwards)
      if (accumulatedDelay > 0 && previousEnd) {
        const gap = Math.max(eventStart - previousEnd, 0);
        accumulatedDelay = Math.max(accumulatedDelay - gap, 0);
      }
      updatedEvent.delay = accumulatedDelay;
      previousEnd = updatedEvent.timeEnd;
    }

    order.push(updatedEvent.id);
    rundown[updatedEvent.id] = { ...updatedEvent };
  }

  isStale = false;
  totalDelay = accumulatedDelay;
  totalDuration = getTotalDuration(firstStart, lastEnd, daySpan);

  return { rundown, order, links, totalDelay, totalDuration, assignedCustomProperties: assignedCustomFields };
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
  totalDelay: number;
  totalDuration: number;
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
    totalDelay,
    totalDuration,
  };
}

/**
 * Returns calculated metadata from rundown
 */
export function getMetadata() {
  if (isStale) {
    console.time('rundownCache__init');
    generate();
    console.timeEnd('rundownCache__init');
  }

  return {
    firstStart,
    lastEnd,
    totalDelay,
    totalDuration,
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
    /**
     * Marking the data set as stale
     * doing it before calling the mutation, gives the function a chance
     * to prevent recalculation by setting stale = false
     */
    isStale = true;

    const { newEvent, newRundown } = mutation({ ...params, persistedRundown });

    revision = revision + 1;
    persistedRundown = newRundown;

    // schedule a non priority cache update
    setImmediate(() => {
      console.time('rundownCache__init');
      get();
      console.timeEnd('rundownCache__init');
    });

    // defer writing to the database
    setImmediate(() => {
      DataProvider.setRundown(persistedRundown);
    });

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

  const eventInMemory = persistedRundown[indexAt];
  if (!hasChanges(eventInMemory, patch)) {
    isStale = false;
    return { newRundown: persistedRundown, newEvent: undefined };
  }

  const newEvent = makeEvent(eventInMemory, patch);

  const newRundown = [...persistedRundown];
  newRundown[indexAt] = newEvent;

  const makeStale = isDataStale(patch);

  if (!makeStale) {
    rundown[newEvent.id] = newEvent;
  }

  isStale = makeStale;
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

/**
 * Invalidates service cache if a custom field is used
 * @param label
 */
function invalidateIfUsed(label: CustomFieldLabel) {
  if (label in assignedCustomFields) {
    isStale = true;
  }
  // if the field was in use, we mark the cache as stale
  if (label in assignedCustomFields) {
    isStale = true;
  }
  // ... and schedule a cache update
  // schedule a non priority cache update
  setImmediate(() => {
    console.time('rundownCache__init');
    generate();
    console.timeEnd('rundownCache__init');
  });
}

/**
 * Scheduløes a non priority custom field persist
 * @param persistedCustomFields
 */
function scheduleCustomFieldPersist(persistedCustomFields: CustomFields) {
  setImmediate(() => {
    DataProvider.setCustomFields(persistedCustomFields);
  });
}

/**
 * Sanitises and creates a custom field in the database
 * @param field
 * @returns
 */
export const createCustomField = async (field: CustomField) => {
  const { label, type, colour } = field;
  const key = label.toLowerCase();
  // check if label already exists
  const alreadyExists = Object.hasOwn(persistedCustomFields, key);

  if (alreadyExists) {
    throw new Error('Label already exists');
  }

  // update object and persist
  persistedCustomFields[key] = { label, type, colour };

  scheduleCustomFieldPersist(persistedCustomFields);

  return persistedCustomFields;
};

/**
 * Edits an existing custom field in the database
 * @param key
 * @param newField
 * @returns
 */
export const editCustomField = async (key: string, newField: Partial<CustomField>) => {
  if (!(key in persistedCustomFields)) {
    throw new Error('Could not find label');
  }

  const existingField = persistedCustomFields[key];
  if (existingField.type !== newField.type) {
    throw new Error('Change of field type is not allowed');
  }

  const newKey = newField.label.toLowerCase();
  persistedCustomFields[newKey] = { ...existingField, ...newField };

  if (key !== newKey) {
    delete persistedCustomFields[key];
    customFieldChangelog[key] = newKey;
  }

  scheduleCustomFieldPersist(persistedCustomFields);
  invalidateIfUsed(key);

  return persistedCustomFields;
};

/**
 * Deletes a custom field from the database
 * @param label
 */
export const removeCustomField = async (label: string) => {
  if (label in persistedCustomFields) {
    delete persistedCustomFields[label];
  }

  scheduleCustomFieldPersist(persistedCustomFields);
  invalidateIfUsed(label);

  return persistedCustomFields;
};
