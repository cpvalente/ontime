import { OntimeEvent, CustomFieldLabel, CustomFields, OntimeEntry, OntimeBaseEvent } from 'ontime-types';
import { dayInMs, getLinkedTimes } from 'ontime-utils';

/**
 * Checks that link can be established (ie, events exist and are valid)
 * and populates the time data from link
 * With the current implementation, the links is always the previous playable event
 * Mutates mutableEvent in place
 * Mutates links in place
 */
export function handleLink(
  mutableEvent: OntimeEvent,
  previousEvent: OntimeEvent | null,
  links: Record<string, string>,
): void {
  if (!mutableEvent.linkStart) {
    return;
  }

  /**
   * If no previous event exist, we dont remove the link
   * this means that the event will keep the behaviour in case a new event is added before
   * However, we do add its ID to the links and prevent out-of-sync data
   */
  if (!previousEvent) {
    mutableEvent.linkStart = 'true';
    return;
  }

  const timePatch = getLinkedTimes(mutableEvent, previousEvent);
  mutableEvent.linkStart = previousEvent.id;
  links[previousEvent.id] = mutableEvent.id;
  // use object.assign to force mutation
  Object.assign(mutableEvent, timePatch);
}

/**
 * Utility function to add an entry, mutates given assignedCustomFields in place
 * @param label
 * @param eventId
 */
export function addToCustomAssignment(
  label: CustomFieldLabel,
  eventId: string,
  assignedCustomFields: Record<string, string[]>,
) {
  if (!Array.isArray(assignedCustomFields[label])) {
    assignedCustomFields[label] = [];
  }
  assignedCustomFields[label].push(eventId);
}

/**
 * Sanitises custom fields and updates values if necessary
 * Mudates in place mutableEvent and assignedCustomFields
 */
export function handleCustomField(
  customFields: CustomFields,
  customFieldChangelog: Map<string, string>,
  mutableEvent: OntimeEvent,
  assignedCustomFields: Record<string, string[]>,
) {
  for (const field in mutableEvent.custom) {
    // rename the property if it is in the changelog
    if (customFieldChangelog.has(field)) {
      const oldData = mutableEvent.custom[field];
      const newLabel = customFieldChangelog.get(field) as string; // it os OK to cast to string here since we already checked that it existed

      mutableEvent.custom[newLabel] = oldData;
      delete mutableEvent.custom[field];
      addToCustomAssignment(newLabel, mutableEvent.id, assignedCustomFields);
      continue;
    }

    if (field in customFields) {
      // add field to assignment map
      addToCustomAssignment(field, mutableEvent.id, assignedCustomFields);
    } else {
      // delete data if it is not declared in project level custom fields
      delete mutableEvent.custom[field];
    }
  }
}

/** List of event properties which do not need the rundown to be regenerated */
enum RegenerateWhitelist {
  'id',
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
}

/**
 * given a patch, returns whether all keys are whitelisted
 * @param path
 */
export function isDataStale(patch: Partial<OntimeEntry>): boolean {
  return Object.keys(patch).some((key) => !(key in RegenerateWhitelist));
}

/**
 * given a key, returns whether it is whitelisted
 * @param path
 */
export function willCauseRegeneration(key: keyof OntimeEvent): boolean {
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
