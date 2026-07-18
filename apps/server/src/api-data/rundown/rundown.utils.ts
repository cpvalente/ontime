import {
  CustomFields,
  EntryCustomFields,
  EntryId,
  ImportedFields,
  OntimeBaseEvent,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  OntimeMilestone,
  ProjectRundown,
  ProjectRundowns,
  Rundown,
  RundownEntries,
  SupportedEntry,
  TimeStrategy,
  isOntimeDelay,
  isOntimeEvent,
  isOntimeGroup,
  isOntimeMilestone,
  isPlayableEvent,
} from 'ontime-types';
import {
  createDelay,
  createEvent,
  createGroup,
  createMilestone,
  dayInMs,
  generateId,
  getCueCandidate,
  makeString,
  validateEndAction,
  validateTimerType,
  validateTimes,
} from 'ontime-utils';

import { RundownMetadata } from './rundown.types.js';

/**
 * Generates a fully formed RundownEntry of the patch type
 */
export function generateEvent(
  rundown: Rundown,
  eventData: Partial<OntimeEvent> | Partial<OntimeDelay> | Partial<OntimeGroup> | Partial<OntimeMilestone>,
  afterId: EntryId | null,
  parent?: EntryId,
): OntimeEntry {
  if (isOntimeEvent(eventData)) {
    const event = createEvent(eventData, getCueCandidate(rundown.entries, rundown.flatOrder, afterId, parent));
    if (!event) throw new Error('Invalid event type');
    return event;
  }

  const id = eventData.id || getUniqueId(rundown);

  if (isOntimeDelay(eventData)) {
    return createDelay({ duration: eventData.duration ?? 0, id });
  }

  // TODO(v4): allow user to provide a larger patch of the group entry
  if (isOntimeGroup(eventData)) {
    return createGroup({ id, title: eventData.title ?? '' });
  }

  if (isOntimeMilestone(eventData)) {
    return createMilestone({ ...eventData, id });
  }

  throw new Error('Invalid event type');
}

/**
 * Gets the last valid insertion reference for a top-level rundown or group order.
 * Used when appending entries and when generating cues from the preceding entry.
 */
export function getLastInsertId(rundown: Rundown, parent: OntimeGroup | null): EntryId | null {
  const insertionList = parent ? parent.entries : rundown.order;
  return insertionList[insertionList.length - 1] ?? null;
}

/**
 * Resolves a `before` insertion option to the first entry in the relevant order when `true` is provided.
 * String values are already explicit anchors and are returned unchanged.
 */
export function getFirstInsertId(rundown: Rundown, parent: OntimeGroup | null, before: EntryId | true): EntryId | null {
  if (before !== true) {
    return before;
  }

  const insertionList = parent ? parent.entries : rundown.order;
  return insertionList[0] ?? null;
}

/**
 * Gets the sibling before a `before` insertion anchor in the top-level or group order.
 * Returns `null` when the new entry will be inserted at the start.
 */
export function getPreviousInsertId(
  rundown: Rundown,
  parent: OntimeGroup | null,
  beforeId: EntryId | null,
): EntryId | null {
  if (beforeId === null) {
    return null;
  }

  const insertionList = parent ? parent.entries : rundown.order;
  const beforeIndex = insertionList.indexOf(beforeId);
  if (beforeIndex < 1) {
    return null;
  }

  return insertionList[beforeIndex - 1] ?? null;
}

export function createEventPatch(originalEvent: OntimeEvent, patchEvent: Partial<OntimeEvent>): OntimeEvent {
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

export function createGroupPatch(originalGroup: OntimeGroup, patchGroup: Partial<OntimeGroup>): OntimeGroup {
  if (Object.keys(patchGroup).length === 0) {
    return originalGroup;
  }

  const maybeTargetDuration = () => {
    if (typeof patchGroup.targetDuration === 'number') {
      return patchGroup.targetDuration;
    }
    if (patchGroup.targetDuration === null || patchGroup.targetDuration === '') {
      return null;
    }
    return originalGroup.targetDuration;
  };

  return {
    id: originalGroup.id,
    type: SupportedEntry.Group,
    title: makeString(patchGroup.title, originalGroup.title),
    note: makeString(patchGroup.note, originalGroup.note),
    entries: patchGroup.entries ?? originalGroup.entries,
    targetDuration: maybeTargetDuration(),
    colour: makeString(patchGroup.colour, originalGroup.colour),
    revision: originalGroup.revision,
    timeStart: originalGroup.timeStart,
    timeEnd: originalGroup.timeEnd,
    duration: originalGroup.duration,
    isFirstLinked: originalGroup.isFirstLinked,
    custom: { ...originalGroup.custom, ...patchGroup.custom },
  };
}

export function createMilestonePatch(
  originalMilestone: OntimeMilestone,
  patchMilestone: Partial<OntimeMilestone>,
): OntimeMilestone {
  if (Object.keys(patchMilestone).length === 0) {
    return originalMilestone;
  }

  return {
    id: originalMilestone.id,
    type: SupportedEntry.Milestone,
    cue: makeString(patchMilestone.cue ?? null, originalMilestone.cue),
    title: makeString(patchMilestone.title, originalMilestone.title),
    note: makeString(patchMilestone.note, originalMilestone.note),
    colour: makeString(patchMilestone.colour, originalMilestone.colour),
    revision: originalMilestone.revision,
    custom: { ...originalMilestone.custom, ...patchMilestone.custom },
    parent: originalMilestone.parent,
  };
}

/**
 * Utility function for patching an existing event with new data
 * Increments the revision of the event when applying the patch
 */
export function applyPatchToEntry(eventFromRundown: OntimeEntry, patch: Partial<OntimeEntry>): OntimeEntry {
  if (isOntimeEvent(eventFromRundown)) {
    const newEvent = createEventPatch(eventFromRundown as OntimeEvent, patch as Partial<OntimeEvent>);
    newEvent.revision++;
    return newEvent;
  }

  if (isOntimeGroup(eventFromRundown)) {
    const newGroup = createGroupPatch(eventFromRundown as OntimeGroup, patch as Partial<OntimeGroup>);
    newGroup.revision++;
    return newGroup;
  }

  if (isOntimeMilestone(eventFromRundown)) {
    const newMilestone = createMilestonePatch(eventFromRundown as OntimeMilestone, patch as Partial<OntimeMilestone>);
    newMilestone.revision++;
    return newMilestone;
  }

  // only delay is left
  return { ...eventFromRundown, ...patch } as OntimeDelay;
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

/**
 * Builds an entry patch containing exactly the fields the spreadsheet supplied, for both built-in
 * and custom fields. Everything the sheet did not map is left out, so applying the patch keeps the
 * existing value for those fields.
 */
function buildImportPatch(entry: OntimeEntry, providedFields: ImportedFields): Partial<OntimeEntry> {
  const source = entry as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const field of providedFields.event) {
    patch[field] = source[field];
  }
  if (providedFields.custom.length > 0) {
    const entryCustom = (source.custom ?? {}) as EntryCustomFields;
    const custom: EntryCustomFields = {};
    for (const key of providedFields.custom) {
      custom[key] = entryCustom[key] ?? '';
    }
    patch.custom = custom;
  }
  return patch as Partial<OntimeEntry>;
}

/**
 * Merges an imported rundown into an existing one
 * - the incoming rundown is the source of truth for entry identity and structure (order + grouping)
 * - a matched entry of the same type is merged field-by-field: a field the sheet provided overwrites
 *   (even when empty), a field the sheet cannot express (an event's automations, a group's target
 *   duration, an unmapped custom field) is kept from the existing entry
 * - a new id, or an id whose type changed, takes the incoming entry wholesale
 * - existing entries absent from the incoming rundown are dropped
 */
export function mergeRundownPreservingFields(
  incoming: Readonly<Rundown>,
  existing: Readonly<Rundown>,
  providedFields: ImportedFields,
): Rundown {
  const entries: RundownEntries = {};

  for (const [id, incomingEntry] of Object.entries(incoming.entries)) {
    const existingEntry = existing.entries[id];

    // a new id, or one whose type changed, is not compatible for a merge: take the incoming data
    if (existingEntry === undefined || existingEntry.type !== incomingEntry.type) {
      entries[id] = incomingEntry;
      continue;
    }

    // merge the sheet's data onto the existing entry through the canonical patch function, which
    // keeps every unmapped field and infers an event's time strategy from the provided times
    const merged = applyPatchToEntry(existingEntry, buildImportPatch(incomingEntry, providedFields));
    // grouping comes from the sheet structure, not a data column: a group owns its children, every
    // other entry knows its parent
    const structure = isOntimeGroup(incomingEntry)
      ? { entries: incomingEntry.entries }
      : { parent: incomingEntry.parent };
    entries[id] = structuredClone({ ...merged, ...structure });
  }

  return {
    id: existing.id,
    title: existing.title,
    order: [...incoming.order],
    flatOrder: [...incoming.flatOrder],
    revision: existing.revision + 1,
    entries,
  };
}

/**
 * Whether the currently playing event survives a change to its rundown,
 * i.e. it still exists and is playable in the new version.
 */
export function isLoadedPlayable(loadedEventId: EntryId, rundown: Readonly<Rundown>): boolean {
  const entry = rundown.entries[loadedEventId];
  return entry !== undefined && isOntimeEvent(entry) && isPlayableEvent(entry);
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
 * Gathers business logic for how to clone an OntimeMilestone
 */
export function cloneMilestone(entry: OntimeMilestone, newId: EntryId): OntimeMilestone {
  const newEntry = structuredClone(entry);
  newEntry.id = newId;
  return newEntry;
}

/**
 * Gathers business logic for how to clone an OntimeGroup
 */
export function cloneGroup(entry: OntimeGroup, newId: EntryId): OntimeGroup {
  const newEntry = structuredClone(entry);
  newEntry.id = newId;

  // in groups, we need to remove the events references
  newEntry.entries = [];
  newEntry.title = `${entry.title || 'Untitled'} (copy)`;
  newEntry.revision = 0;
  return newEntry;
}

/**
 * Clones a group and all its nested entries
 */
export function makeDeepClone(
  group: OntimeGroup,
  rundown: Rundown,
): { newGroup: OntimeGroup; nestedEntries: OntimeEntry[] } {
  const newGroupId = getUniqueId(rundown);
  const newGroup = cloneGroup(group, newGroupId);
  const nestedEntries: OntimeEntry[] = [];
  const nestedEntryIds: EntryId[] = [];

  for (let i = 0; i < group.entries.length; i++) {
    const nestedEntryId = group.entries[i];
    const nestedEntry = rundown.entries[nestedEntryId];
    if (!nestedEntry) {
      continue;
    }

    // clone the event and assign it to the new group
    const nestedEntryNewId = getUniqueId(rundown);
    const newNestedEntry = cloneSimpleRundownEntry(nestedEntry, nestedEntryNewId);
    (newNestedEntry as OntimeEvent | OntimeDelay | OntimeMilestone).parent = newGroup.id;

    nestedEntryIds.push(nestedEntryNewId);
    nestedEntries.push(newNestedEntry);
  }

  // update the new group with the nested entries
  newGroup.entries = nestedEntryIds;

  return { newGroup, nestedEntries };
}

/**
 * Receives an entry and chooses the correct cloning strategy
 * @throws if the source entry is unknown or a group
 */
export function cloneSimpleRundownEntry(entry: OntimeEntry, newId: EntryId): OntimeEntry {
  if (isOntimeEvent(entry)) {
    return cloneEvent(entry, newId);
  } else if (isOntimeDelay(entry)) {
    return cloneDelay(entry, newId);
  } else if (isOntimeMilestone(entry)) {
    return cloneMilestone(entry, newId);
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
 * Sanitises custom fields in an entry by removing fields
 * - if it does not exist in the project
 * - if the value is empty string
 * Mutates the entryCustomFields object
 */
export function cleanupCustomFields(entryCustomFields: EntryCustomFields, projectCustomFields: CustomFields) {
  for (const field in entryCustomFields) {
    if (!Object.hasOwn(projectCustomFields, field)) {
      delete entryCustomFields[field];
    } else if (entryCustomFields[field] === '') {
      delete entryCustomFields[field];
    }
  }
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

/**
 * converts a project rundowns map into an array of rundowns
 */
export function normalisedToRundownArray(rundowns: ProjectRundowns): ProjectRundown[] {
  return Object.values(rundowns).map(({ id, flatOrder, title, revision }) => {
    return { id, numEntries: flatOrder.length, title, revision };
  });
}

export type IncrementNumber = {
  integer: number;
  faction: number;
  precision: number;
};

/**
 * Parses a decimal string into integer part, fractional digits as an integer, and fractional digit count.
 * Splits on the first `.` only
 *
 * @param value - Numeric string, e.g. `"123"` or `"123.456"`.
 * @returns `integer` whole part, `faction` digits after the point as a number (0 when no fraction), `precision` digit count after `.`.
 * @throws {Error} When the integer or fractional segment is not parseable as number
 */
export function getIntegerAndFraction(value: string): IncrementNumber {
  const [integerStr, factionStr] = value.split('.', 2);
  const integer = parseInt(integerStr);
  const precision = (factionStr ?? '').length;
  const faction = precision === 0 ? 0 : parseInt(factionStr);
  if (isNaN(integer) || isNaN(faction)) throw new Error('input can not be converted to a number');
  return {
    integer,
    faction,
    precision,
  };
}
