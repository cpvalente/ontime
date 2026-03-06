import { isOntimeEvent, OntimeEvent, RundownEntries, TimeStrategy } from 'ontime-types';

export const INDETERMINATE = Symbol('indeterminate');
type Indeterminate = typeof INDETERMINATE;
export type MergedValue<T> = T | Indeterminate;

export function isIndeterminate<T>(v: MergedValue<T>): v is Indeterminate {
  return v === INDETERMINATE;
}

/** Fields included in multi-edit v1 */
const mergeableFields = ['title', 'note', 'colour', 'flag', 'duration', 'timeStrategy', 'endAction', 'countToEnd', 'timeWarning', 'timeDanger'] as const;

type MergeableField = (typeof mergeableFields)[number];

export type MergedCustomFields = Record<string, MergedValue<string>>;

export type MergedEvent = {
  [K in MergeableField]: MergedValue<OntimeEvent[K]>;
} & {
  custom: MergedCustomFields;
  allLockDuration: boolean;
};

export function mergeEvents(entries: RundownEntries, selectedIds: Set<string>): MergedEvent | null {
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
    timeWarning: first.timeWarning,
    timeDanger: first.timeDanger,
    custom: { ...first.custom },
    allLockDuration: false,
  };

  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    for (const field of mergeableFields) {
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

  merged.allLockDuration =
    !isIndeterminate(merged.timeStrategy) && merged.timeStrategy === TimeStrategy.LockDuration;

  return merged;
}
