import {
  EntryId,
  isOntimeBlock,
  isOntimeDelay,
  isOntimeEvent,
  OntimeBaseEvent,
  OntimeBlock,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  Rundown,
  SupportedEntry,
  TimeStrategy,
} from 'ontime-types';
import {
  dayInMs,
  generateId,
  getCueCandidate,
  validateEndAction,
  validateTimerType,
  validateTimes,
} from 'ontime-utils';

import { event as eventDef, block as blockDef, delay as delayDef } from '../../models/eventsDefinition.js';
import { makeString } from '../../utils/parserUtils.js';
import { RundownMetadata } from './rundown.types.js';

type CompleteEntry<T> =
  T extends Partial<OntimeEvent>
    ? OntimeEvent
    : T extends Partial<OntimeDelay>
      ? OntimeDelay
      : T extends Partial<OntimeBlock>
        ? OntimeBlock
        : never;

/**
 * Generates a fully formed RundownEntry of the patch type
 */
export function generateEvent<T extends Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeBlock>>(
  rundown: Rundown,
  eventData: T,
  afterId: EntryId | null,
): CompleteEntry<T> {
  if (isOntimeEvent(eventData)) {
    return createEvent(eventData, getCueCandidate(rundown.entries, rundown.order, afterId)) as CompleteEntry<T>;
  }

  const id = eventData.id || getUniqueId(rundown);

  if (isOntimeDelay(eventData)) {
    return { ...delayDef, duration: eventData.duration ?? 0, id } as CompleteEntry<T>;
  }

  // TODO(v4): allow user to provide a larger patch of the block entry
  if (isOntimeBlock(eventData)) {
    return createBlock({ id, title: eventData.title ?? '' }) as CompleteEntry<T>;
  }

  throw new Error('Invalid event type');
}

export function createPatch(originalEvent: OntimeEvent, patchEvent: Partial<OntimeEvent>): OntimeEvent {
  if (Object.keys(patchEvent).length === 0) {
    return originalEvent;
  }

  const { timeStart, timeEnd, duration, timeStrategy } = validateTimes(
    patchEvent?.timeStart ?? originalEvent.timeStart,
    patchEvent?.timeEnd ?? originalEvent.timeEnd,
    patchEvent?.duration ?? originalEvent.duration,
    patchEvent?.timeStrategy ?? inferStrategy(patchEvent?.timeEnd, patchEvent?.duration, originalEvent.timeStrategy),
  );

  return {
    id: originalEvent.id,
    type: SupportedEntry.Event,
    title: makeString(patchEvent.title, originalEvent.title),
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart: typeof patchEvent.linkStart === 'boolean' ? patchEvent.linkStart : originalEvent.linkStart,
    endAction: validateEndAction(patchEvent.endAction, originalEvent.endAction),
    timerType: validateTimerType(patchEvent.timerType, originalEvent.timerType),
    countToEnd: typeof patchEvent.countToEnd === 'boolean' ? patchEvent.countToEnd : originalEvent.countToEnd,
    skip: typeof patchEvent.skip === 'boolean' ? patchEvent.skip : originalEvent.skip,
    note: makeString(patchEvent.note, originalEvent.note),
    colour: makeString(patchEvent.colour, originalEvent.colour),
    delay: originalEvent.delay, // is regenerated if timer related data is changed
    dayOffset: originalEvent.dayOffset, // is regenerated if timer related data is changed
    gap: originalEvent.gap, // is regenerated if timer related data is changed
    // short circuit empty string
    cue: makeString(patchEvent.cue ?? null, originalEvent.cue),
    parent: originalEvent.parent,
    revision: originalEvent.revision,
    timeWarning: patchEvent.timeWarning ?? originalEvent.timeWarning,
    timeDanger: patchEvent.timeDanger ?? originalEvent.timeDanger,
    custom: { ...originalEvent.custom, ...patchEvent.custom },
    triggers: patchEvent.triggers ?? originalEvent.triggers,
  };
}

/**
 * Utility function for patching an existing event with new data
 * Increments the revision of the event when applying the patch
 */
export function applyPatchToEntry<T extends OntimeEntry>(eventFromRundown: T, patch: Partial<T>): T {
  if (isOntimeEvent(eventFromRundown)) {
    const newEvent = createPatch(eventFromRundown, patch as Partial<OntimeEvent>);
    newEvent.revision++;
    return newEvent as T;
  }
  if (isOntimeBlock(eventFromRundown)) {
    const newBlock: OntimeBlock = { ...eventFromRundown, ...patch };
    newBlock.revision++;
    return newBlock as T;
  }

  // only delay is left
  return { ...eventFromRundown, ...patch } as T;
}

/**
 * @description Enforces formatting for events
 * @param {object} eventArgs - attributes of event
 * @param {number} eventIndex - can be a string when we pass the a suggested cue name
 * @returns {object|null} - formatted object or null in case is invalid
 */
export const createEvent = (eventArgs: Partial<OntimeEvent>, eventIndex: number | string): OntimeEvent | null => {
  if (Object.keys(eventArgs).length === 0) {
    return null;
  }

  const cue = typeof eventIndex === 'number' ? String(eventIndex + 1) : eventIndex;

  const baseEvent = {
    id: eventArgs?.id ?? generateId(),
    cue,
    ...eventDef,
  };
  const event = createPatch(baseEvent, eventArgs);
  return event;
};

/**
 * Creates a new block from an optional patch
 */
export function createBlock(patch?: Partial<OntimeBlock>): OntimeBlock {
  if (!patch) {
    return { ...blockDef, id: generateId() };
  }

  return {
    id: patch.id ?? generateId(),
    type: SupportedEntry.Block,
    title: patch.title ?? '',
    note: patch.note ?? '',
    entries: patch.entries ?? [],
    isNextDay: patch.isNextDay ?? false,
    targetDuration: patch.targetDuration ?? null,
    colour: makeString(patch.colour, ''),
    custom: patch.custom ?? {},
    revision: 0,
    timeStart: null,
    timeEnd: null,
    duration: 0,
    isFirstLinked: false,
  };
}

/**
 * Function infers strategy for a patch with only partial timer data
 * @param end
 * @param duration
 * @param fallback
 * @returns
 */
function inferStrategy(end: unknown, duration: unknown, fallback: TimeStrategy): TimeStrategy {
  if (end && !duration) {
    return TimeStrategy.LockEnd;
  }

  if (!end && duration) {
    return TimeStrategy.LockDuration;
  }
  return fallback;
}

/**
 * Whether a given ID is exists in the current rundown
 */
export function hasId(rundown: Rundown, id: EntryId): boolean {
  return Object.hasOwn(rundown.entries, id);
}

/**
 * Returns an ID guaranteed to be unique
 */
export function getUniqueId(rundown: Rundown): EntryId {
  let id: EntryId;
  do {
    id = generateId();
  } while (rundown.entries[id]);
  return id;
}

/** List of event properties which do not need the rundown to be regenerated */
enum RegenerateWhitelist {
  'id', // adding it for completeness, users cannot change ID
  'type', // adding it for completeness, users cannot change ID
  'cue',
  'title',
  'note',
  'endAction',
  'timerType',
  'countToEnd',
  'colour',
  'timeWarning',
  'timeDanger',
  'custom',
  'triggers',
}

/**
 * given a patch, returns whether it invalidates the rundown metadata
 */
export function doesInvalidateMetadata(patch: Partial<OntimeEntry>): boolean {
  return Object.keys(patch).some(willCauseRegeneration);
}

/**
 * given a key, returns whether it is whitelisted
 */
export function willCauseRegeneration(key: string): boolean {
  return !(key in RegenerateWhitelist);
}

/**
 * Given an event and a patch to that event checks whether there are actual changes to the dataset
 * @param existingEvent
 * @param newEvent
 * @returns
 */
export function hasChanges<T extends OntimeBaseEvent>(existingEvent: T, newEvent: Partial<T>): boolean {
  return Object.keys(newEvent).some(
    (key) => !Object.hasOwn(existingEvent, key) || existingEvent[key as keyof T] !== newEvent[key as keyof T],
  );
}

/**
 * Deletes the first instance of string from an array of strings
 * Used for cases when we want to delete an ID from an array
 *
 * We keep this just for backend because the use of `toSpliced` does not have enough browser support
 */
export function deleteById(array: EntryId[], deleteId: EntryId): EntryId[] {
  const deleteIndex = array.findIndex((id) => id === deleteId);
  if (deleteIndex === -1) {
    return array;
  }
  return array.toSpliced(deleteIndex, 1);
}

/**
 * Gathers business logic for how to clone an OntimeEvent
 */
export function cloneEvent(entry: OntimeEvent, newId: EntryId): OntimeEvent {
  const newEntry = structuredClone(entry);
  newEntry.id = newId;
  newEntry.revision = 0;
  return newEntry;
}

/**
 * Gathers business logic for how to clone an OntimeDelay
 */
export function cloneDelay(entry: OntimeDelay, newId: EntryId): OntimeDelay {
  const newEntry = structuredClone(entry);
  newEntry.id = newId;
  return newEntry;
}

/**
 * Gathers business logic for how to clone an OntimeBlock
 */
export function cloneBlock(entry: OntimeBlock, newId: EntryId): OntimeBlock {
  const newEntry = structuredClone(entry);
  newEntry.id = newId;

  // in blocks, we need to remove the events references
  newEntry.entries = [];
  newEntry.revision = 0;
  return newEntry;
}

/**
 * Receives an entry and chooses the correct cloning strategy
 */
export function cloneEntry<T extends OntimeEntry>(entry: T, newId: EntryId): T {
  if (isOntimeEvent(entry)) {
    return cloneEvent(entry, newId) as T;
  } else if (isOntimeDelay(entry)) {
    return cloneDelay(entry, newId) as T;
  } else if (entry.type === 'block') {
    return cloneBlock(entry as OntimeBlock, newId) as T;
  }
  throw new Error(`Unsupported entry type for cloning: ${entry}`);
}

/**
 * Utility for calculating if the current events should have a day offset
 * @param current the current event under test
 * @param previous the previous event
 * @returns 0 or 1 for easy accumulation with the total days
 */
export function calculateDayOffset(
  current: Pick<OntimeEvent, 'timeStart'>,
  previous: Pick<OntimeEvent, 'timeStart' | 'duration'> | null,
) {
  // if there is no previous there can't be a day offset
  if (!previous) {
    return 0;
  }

  // if the previous events duration is zero it will push the current event to next day
  if (previous.duration === 0) {
    return 0;
  }

  // if the previous event crossed midnight then the current event is in the next day
  if (previous.timeStart + previous.duration >= dayInMs) {
    return 1;
  }

  // if the current events starts at the same time or before the previous event then it is the next day
  if (current.timeStart <= previous.timeStart) {
    return 1;
  }

  return 0;
}

/**
 * Receives an insertion order and returns the reference to an event ID
 * after which we will insert the new event
 */
export function getInsertAfterId(rundown: Rundown, afterId?: EntryId, beforeId?: EntryId): EntryId | null {
  if (afterId) {
    return afterId;
  }

  if (beforeId) {
    const atIndex = rundown.flatOrder.findIndex((id) => id === beforeId);
    if (atIndex < 1) return null;
    return rundown.flatOrder[atIndex - 1];
  }

  return null;
}

/**
 * converts an index from the timedEventOrder to an index in the playableEventOrder
 * or returns null if it can not be found
 */
export function getPlayableIndexFromTimedIndex(metadata: RundownMetadata, index: number): number | null {
  const timedId = metadata.timedEventOrder[index];
  const playableIndex = metadata.playableEventOrder.findIndex((id) => id === timedId);
  return playableIndex < 0 ? null : playableIndex;
}

/**
 * converts an index from the playableEventOrder to an index in the timedEventOrder
 * all indexes in playableEventOrder must also exist in timedEventOrder, otherwise the app is broken
 */
export function getTimedIndexFromPlayableIndex(metadata: RundownMetadata, index: number): number {
  const playableId = metadata.playableEventOrder[index];
  const timedIndex = metadata.timedEventOrder.findIndex((id) => id === playableId);
  return timedIndex;
}
