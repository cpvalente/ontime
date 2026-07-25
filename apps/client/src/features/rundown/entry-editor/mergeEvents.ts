import { CustomFieldKey, OntimeEvent } from 'ontime-types';

/**
 * Marks a value which is not the same across the entries being edited
 * This is a distinct value from undefined, which means that the field is absent
 * Being a symbol, it also cannot be assigned to a patch by accident
 */
export const conflict: unique symbol = Symbol('conflict');
export type Conflict = typeof conflict;

/** A value which may not be the same across the entries being edited */
export type MergedValue<T> = T | Conflict;

export function isConflict<T>(value: MergedValue<T>): value is Conflict {
  return value === conflict;
}

/** Resolves a merged value for the UI, where an unknown value is represented by undefined */
export function resolveConflict<T>(value: MergedValue<T>): T | undefined {
  return isConflict(value) ? undefined : value;
}

/**
 * Fields which can be edited across a selection of events
 * timeStart and timeEnd are absolute points in time and are excluded:
 * giving several events the same start or end collapses their durations
 */
export const batchEditableFields = [
  'title',
  'note',
  'colour',
  'flag',
  'duration',
  'endAction',
  'countToEnd',
  'timerType',
  'timeWarning',
  'timeDanger',
  'linkStart',
] as const;

type BatchEditableField = (typeof batchEditableFields)[number];

/**
 * Custom fields of the entries being edited
 * A missing key means that none of the entries have a value for that field
 */
export type MergedCustomFields = Record<CustomFieldKey, MergedValue<string>>;

/**
 * A merged view over a set of events
 * A field holds the conflict symbol when the events do not agree on its value
 */
export type MergedEvent = {
  [K in BatchEditableField]: MergedValue<OntimeEvent[K]>;
} & {
  custom: MergedCustomFields;
};

/**
 * Merges a list of events into a single view
 * For a single event, no field is in conflict and every value matches the event
 * @param events - events to merge, must contain at least one element
 */
export function mergeEvents(events: OntimeEvent[]): MergedEvent {
  return {
    title: mergeField(events, 'title'),
    note: mergeField(events, 'note'),
    colour: mergeField(events, 'colour'),
    flag: mergeField(events, 'flag'),
    duration: mergeField(events, 'duration'),
    endAction: mergeField(events, 'endAction'),
    countToEnd: mergeField(events, 'countToEnd'),
    timerType: mergeField(events, 'timerType'),
    timeWarning: mergeField(events, 'timeWarning'),
    timeDanger: mergeField(events, 'timeDanger'),
    linkStart: mergeField(events, 'linkStart'),
    custom: mergeCustomFields(events),
  };
}

/**
 * Returns the shared value of a field, or the conflict symbol if the events disagree
 */
function mergeField<K extends BatchEditableField>(events: OntimeEvent[], field: K): MergedValue<OntimeEvent[K]> {
  const value = events[0][field];
  return events.some((event) => event[field] !== value) ? conflict : value;
}

/**
 * Merges the custom fields of a list of events
 * Fields missing from an entry are considered empty
 */
function mergeCustomFields(events: OntimeEvent[]): MergedCustomFields {
  const merged: MergedCustomFields = {};

  for (const event of events) {
    for (const key of Object.keys(event.custom)) {
      if (key in merged) {
        continue;
      }
      const value = event.custom[key] ?? '';
      merged[key] = events.some((other) => (other.custom[key] ?? '') !== value) ? conflict : value;
    }
  }

  return merged;
}
