import { CustomFieldKey, OntimeEvent } from 'ontime-types';

/**
 * Fields which can be edited across a selection of events
 * Schedule fields, cue and triggers are deliberately excluded:
 * they are either unique to an event or would cascade through the rundown
 */
export const batchEditableFields = [
  'title',
  'note',
  'colour',
  'flag',
  'endAction',
  'countToEnd',
  'timerType',
  'timeWarning',
  'timeDanger',
  'linkStart',
] as const;

type BatchEditableField = (typeof batchEditableFields)[number];

export type MergedCustomFields = Record<CustomFieldKey, string | undefined>;

/**
 * A merged view over a set of events
 * A field is undefined when the events do not agree on its value
 */
export type MergedEvent = {
  [K in BatchEditableField]: OntimeEvent[K] | undefined;
} & {
  custom: MergedCustomFields;
};

/**
 * Merges a list of events into a single view
 * For a single event, every field is defined and matches the event
 * @param events - events to merge, must contain at least one element
 */
export function mergeEvents(events: OntimeEvent[]): MergedEvent {
  return {
    title: mergeField(events, 'title'),
    note: mergeField(events, 'note'),
    colour: mergeField(events, 'colour'),
    flag: mergeField(events, 'flag'),
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
 * Returns the shared value of a field, or undefined if the events disagree
 */
function mergeField<K extends BatchEditableField>(events: OntimeEvent[], field: K): OntimeEvent[K] | undefined {
  const value = events[0][field];
  return events.some((event) => event[field] !== value) ? undefined : value;
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
      merged[key] = events.some((other) => (other.custom[key] ?? '') !== value) ? undefined : value;
    }
  }

  return merged;
}
