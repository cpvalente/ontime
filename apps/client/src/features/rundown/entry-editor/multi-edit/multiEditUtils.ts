import { EntryId, isOntimeEvent, OntimeEvent, RundownEntries, TimeStrategy } from 'ontime-types';

export const INDETERMINATE = Symbol('indeterminate');
type Indeterminate = typeof INDETERMINATE;
export type MergedValue<T> = T | Indeterminate;

export function isIndeterminate<T>(v: MergedValue<T>): v is Indeterminate {
  return v === INDETERMINATE;
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
};

export function mergeEvents(entries: RundownEntries, selectedIds: Set<string>, flatOrder: EntryId[]): MergedEvent | null {
  const events: OntimeEvent[] = [];
  for (const id of selectedIds) {
    const entry = entries[id];
    if (entry && isOntimeEvent(entry)) {
      events.push(entry);
    }
  }

  if (events.length < 2) {
    return null;
  }

  // Find the first OntimeEvent in the rundown to exclude from linkStart merge
  // (the first event can never be linked — there is nothing before it)
  let firstRundownEventId: string | undefined;
  for (const id of flatOrder) {
    const entry = entries[id];
    if (entry && isOntimeEvent(entry)) {
      firstRundownEventId = id;
      break;
    }
  }

  const first = events[0];
  const merged: MergedEvent = {
    title: first.title,
    note: first.note,
    colour: first.colour,
    flag: first.flag,
    duration: first.duration,
    timeStrategy: first.timeStrategy,
    endAction: first.endAction,
    countToEnd: first.countToEnd,
    timerType: first.timerType,
    timeWarning: first.timeWarning,
    timeDanger: first.timeDanger,
    linkStart: first.linkStart,
    custom: { ...first.custom },
    allLockDuration: false,
  };

  // If the first event in the merged set is the first rundown event, seed linkStart from the second event
  const firstIsRundownFirst = first.id === firstRundownEventId;
  if (firstIsRundownFirst && events.length >= 2) {
    merged.linkStart = events[1].linkStart;
  }

  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    for (const field of mergeableFields) {
      if (field === 'linkStart') continue; // handled separately below
      if (merged[field] !== INDETERMINATE && event[field] !== first[field]) {
        (merged[field] as MergedValue<unknown>) = INDETERMINATE;
      }
    }
    // Merge custom fields per-key
    for (const key of Object.keys(merged.custom)) {
      if (merged.custom[key] !== INDETERMINATE && event.custom[key] !== first.custom[key]) {
        merged.custom[key] = INDETERMINATE;
      }
    }
  }

  // Merge linkStart separately, skipping the first rundown event
  const linkStartEvents = events.filter((e) => e.id !== firstRundownEventId);
  if (linkStartEvents.length === 0) {
    // All selected events are the first event (shouldn't happen with 2+ events, but be safe)
    merged.linkStart = false as MergedValue<boolean>;
  } else {
    const refValue = linkStartEvents[0].linkStart;
    merged.linkStart = refValue;
    for (let i = 1; i < linkStartEvents.length; i++) {
      if (linkStartEvents[i].linkStart !== refValue) {
        merged.linkStart = INDETERMINATE;
        break;
      }
    }
  }

  merged.allLockDuration =
    !isIndeterminate(merged.timeStrategy) && merged.timeStrategy === TimeStrategy.LockDuration;

  return merged;
}
