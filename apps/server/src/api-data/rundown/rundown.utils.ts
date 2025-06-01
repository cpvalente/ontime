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
import { generateId, getCueCandidate, validateEndAction, validateTimerType, validateTimes } from 'ontime-utils';

import { event as eventDef, block as blockDef, delay as delayDef } from '../../models/eventsDefinition.js';
import { makeString } from '../../utils/parserUtils.js';

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
    isPublic: typeof patchEvent.isPublic === 'boolean' ? patchEvent.isPublic : originalEvent.isPublic,
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
    events: patch.events ?? [],
    skip: patch.skip ?? false,
    colour: makeString(patch.colour, ''),
    custom: patch.custom ?? {},
    revision: 0,
    startTime: null,
    endTime: null,
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
  'isPublic',
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
