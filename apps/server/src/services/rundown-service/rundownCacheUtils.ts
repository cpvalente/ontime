import {
  OntimeEvent,
  isOntimeEvent,
  OntimeRundown,
  CustomFieldLabel,
  CustomFields,
  OntimeRundownEntry,
  OntimeBaseEvent,
} from 'ontime-types';
import { dayInMs, getLinkedTimes } from 'ontime-utils';

/**
 * Get linked event
 */
export function getLink(currentIndex: number, rundown: OntimeRundown): OntimeEvent | null {
  // currently the link is the previous event
  for (let i = currentIndex - 1; i >= 0; i--) {
    const event = rundown[i];
    if (isOntimeEvent(event) && !event.skip) {
      return event;
    }
  }
  return null;
}

/**
 * Populates data from link, if necessary
 * Mutates in place mutableEvent
 * Mutates in place links
 */
export function handleLink(
  currentIndex: number,
  rundown: OntimeRundown,
  mutableEvent: OntimeEvent,
  links: Record<string, string>,
): void {
  if (!mutableEvent.linkStart) {
    return;
  }

  const linkedEvent = getLink(currentIndex, rundown);
  if (!linkedEvent) {
    mutableEvent.linkStart = null;
    return;
  }

  // sometimes the client cannot set the previous event
  if (mutableEvent.linkStart === 'true') {
    mutableEvent.linkStart = linkedEvent.id;
  }

  links[linkedEvent.id] = mutableEvent.id;

  const timePatch = getLinkedTimes(mutableEvent, linkedEvent);
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
export enum regenerateWhitelist {
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
export function isDataStale(patch: Partial<OntimeRundownEntry>): boolean {
  return Object.keys(patch).some((key) => !(key in regenerateWhitelist));
}

/**
 * given a key, returns whether it is whitelisted
 * @param path
 */
export function willCauseRegeneration(key: keyof OntimeEvent): boolean {
  return !(key in regenerateWhitelist);
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
 * @returns 0 or 1 for easy acumelation with the total days
 */
export function calculateDayOffset(
  current: Pick<OntimeEvent, 'timeStart'>,
  previous?: Pick<OntimeEvent, 'timeStart' | 'duration'>,
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
