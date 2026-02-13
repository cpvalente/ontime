import type { OntimeDelay, OntimeEvent, OntimeGroup, OntimeMilestone } from 'ontime-types';
import { SupportedEntry, TimeStrategy } from 'ontime-types';

import { generateId } from '../generate-id/generateId.js';
import { validateEndAction, validateTimerType } from '../validate-events/validateEvent.js';
import { validateTimes } from '../validate-times/validateTimes.js';
import { event as eventDef, group as groupDef, milestone as milestoneDef } from './entryDefinitions.js';

/**
 * @description Ensures variable is string, it skips object types
 * @param val - variable to convert
 * @param {string} [fallback=''] - fallback value
 * @returns {string} - value as string or fallback if not possible
 */
export const makeString = (val: unknown, fallback = ''): string => {
  if (typeof val === 'string') return val.trim();
  else if (val == null || val.constructor === Object) return fallback;
  return val.toString().trim();
};

/**
 * Creates a new delay from an optional patch
 */
export function createDelay(patch?: Partial<OntimeDelay>): OntimeDelay {
  return {
    type: SupportedEntry.Delay,
    id: patch?.id ?? generateId(),
    duration: patch?.duration ?? 0,
    parent: patch?.parent ?? null,
  };
}

/**
 * @description Enforces formatting for events
 * @param {object} eventArgs - attributes of event
 * @param {number} eventIndex - can be a string when we pass the a suggested cue name
 * @returns {object|null} - formatted object or null in case is invalid
 */
export const createEvent = (eventArgs: Partial<OntimeEvent>, eventIndex: number | string = ''): OntimeEvent | null => {
  if (Object.keys(eventArgs).length === 0) {
    return null;
  }

  const cue = typeof eventIndex === 'number' ? String(eventIndex + 1) : eventIndex;

  const baseEvent = {
    id: eventArgs?.id ?? generateId(),
    cue,
    ...eventDef,
  };
  const event = createEventPatch(baseEvent, eventArgs);
  return event;
};

/**
 * Creates a new group from an optional patch
 */
export function createGroup(patch?: Partial<OntimeGroup>): OntimeGroup {
  if (!patch) {
    return { ...groupDef, id: generateId() };
  }

  return {
    id: patch.id ?? generateId(),
    type: SupportedEntry.Group,
    title: patch.title ?? '',
    note: patch.note ?? '',
    entries: patch.entries ?? [],
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
 * Creates a new milestone from an optional patch
 */
export function createMilestone(patch?: Partial<OntimeMilestone>): OntimeMilestone {
  if (!patch) {
    return { ...milestoneDef, id: generateId() };
  }

  return {
    id: patch.id ?? generateId(),
    type: SupportedEntry.Milestone,
    cue: patch.cue ?? '',
    title: patch.title ?? '',
    note: patch.note ?? '',
    colour: makeString(patch.colour, ''),
    custom: patch.custom ?? {},
    parent: patch.parent ?? null,
    revision: 0,
  };
}

/**
 * Function infers strategy for a patch with only partial timer data
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

function createEventPatch(originalEvent: OntimeEvent, patchEvent: Partial<OntimeEvent>): OntimeEvent {
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
    flag: typeof patchEvent.flag === 'boolean' ? patchEvent.flag : originalEvent.flag,
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
