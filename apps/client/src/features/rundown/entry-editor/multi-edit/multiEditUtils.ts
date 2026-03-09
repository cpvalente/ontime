import { EntryId, isOntimeEvent, OntimeEvent, RundownEntries, TimeStrategy } from 'ontime-types';

export const INDETERMINATE = Symbol('indeterminate');
type Indeterminate = typeof INDETERMINATE;
export type MergedValue<T> = T | Indeterminate;

export function isIndeterminate<T>(v: MergedValue<T>): v is Indeterminate {
  return v === INDETERMINATE;
}

export interface BooleanTally {
  onCount: number;
  offCount: number;
  majority: boolean;
}

export function booleanTally(events: OntimeEvent[], field: keyof OntimeEvent): BooleanTally {
  let onCount = 0;
  for (const event of events) {
    if (event[field]) onCount++;
  }
  const offCount = events.length - onCount;
  return { onCount, offCount, majority: onCount >= offCount };
}

/** Fields included in multi-edit v1 */
const mergeableFields = ['title', 'note', 'colour', 'flag', 'duration', 'timeStrategy', 'endAction', 'countToEnd', 'timerType', 'timeWarning', 'timeDanger', 'linkStart'] as const;

type MergeableField = (typeof mergeableFields)[number];

export type MergedCustomFields = Record<string, MergedValue<string>>;

export type MergedEvent = {
  [K in MergeableField]: MergedValue<OntimeEvent[K]>;
} & {
  custom: MergedCustomFields;
  allLockDuration: boolean;
  allLockEnd: boolean;
  flagTally: BooleanTally;
  countToEndTally: BooleanTally;
};

/**
 * Generic single-field merge: compare all events to the first.
 * Returns the common value if all agree, INDETERMINATE on mismatch.
 */
export function mergeField<K extends keyof OntimeEvent>(events: OntimeEvent[], field: K): MergedValue<OntimeEvent[K]> {
  const ref = events[0][field];
  for (let i = 1; i < events.length; i++) {
    if (events[i][field] !== ref) {
      return INDETERMINATE;
    }
  }
  return ref;
}

/**
 * Merge linkStart across events, excluding the first rundown event
 * (the first event can never be linked — there is nothing before it).
 */
export function mergeLinkStart(events: OntimeEvent[], firstRundownEventId: string | undefined): MergedValue<boolean> {
  const linkStartEvents = events.filter((e) => e.id !== firstRundownEventId);
  if (linkStartEvents.length === 0) {
    return false;
  }
  const ref = linkStartEvents[0].linkStart;
  for (let i = 1; i < linkStartEvents.length; i++) {
    if (linkStartEvents[i].linkStart !== ref) {
      return INDETERMINATE;
    }
  }
  return ref;
}

/** Merge custom fields per-key across events. */
export function mergeCustomFields(events: OntimeEvent[]): MergedCustomFields {
  const first = events[0];
  const merged: MergedCustomFields = { ...first.custom };
  for (let i = 1; i < events.length; i++) {
    for (const key of Object.keys(merged)) {
      if (merged[key] !== INDETERMINATE && events[i].custom[key] !== first.custom[key]) {
        merged[key] = INDETERMINATE;
      }
    }
  }
  return merged;
}

/** Derive whether all events lock duration from the merged timeStrategy. */
export function deriveAllLockDuration(mergedTimeStrategy: MergedValue<TimeStrategy>): boolean {
  return !isIndeterminate(mergedTimeStrategy) && mergedTimeStrategy === TimeStrategy.LockDuration;
}

/** Derive whether all events lock end from the merged timeStrategy. */
export function deriveAllLockEnd(mergedTimeStrategy: MergedValue<TimeStrategy>): boolean {
  return !isIndeterminate(mergedTimeStrategy) && mergedTimeStrategy === TimeStrategy.LockEnd;
}

/** Filter selected entries down to OntimeEvents only. */
export function filterSelectedEvents(entries: RundownEntries, selectedIds: Set<string>): OntimeEvent[] {
  const events: OntimeEvent[] = [];
  for (const id of selectedIds) {
    const entry = entries[id];
    if (entry && isOntimeEvent(entry)) {
      events.push(entry);
    }
  }
  return events;
}

/** Find the first OntimeEvent ID in the rundown order. */
export function findFirstRundownEventId(entries: RundownEntries, flatOrder: EntryId[]): string | undefined {
  for (const id of flatOrder) {
    const entry = entries[id];
    if (entry && isOntimeEvent(entry)) {
      return id;
    }
  }
  return undefined;
}

export function mergeEvents(entries: RundownEntries, selectedIds: Set<string>, flatOrder: EntryId[]): MergedEvent | null {
  const events = filterSelectedEvents(entries, selectedIds);
  if (events.length < 2) return null;

  const firstRundownEventId = findFirstRundownEventId(entries, flatOrder);
  const timeStrategy = mergeField(events, 'timeStrategy');

  return {
    title: mergeField(events, 'title'),
    note: mergeField(events, 'note'),
    colour: mergeField(events, 'colour'),
    flag: mergeField(events, 'flag'),
    duration: mergeField(events, 'duration'),
    timeStrategy,
    endAction: mergeField(events, 'endAction'),
    countToEnd: mergeField(events, 'countToEnd'),
    timerType: mergeField(events, 'timerType'),
    timeWarning: mergeField(events, 'timeWarning'),
    timeDanger: mergeField(events, 'timeDanger'),
    linkStart: mergeLinkStart(events, firstRundownEventId),
    custom: mergeCustomFields(events),
    allLockDuration: deriveAllLockDuration(timeStrategy),
    allLockEnd: deriveAllLockEnd(timeStrategy),
    flagTally: booleanTally(events, 'flag'),
    countToEndTally: booleanTally(events, 'countToEnd'),
  };
}
