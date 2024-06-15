import {
  OntimeEvent,
  isOntimeEvent,
  OntimeRundown,
  CustomFieldLabel,
  CustomFields,
  OntimeRundownEntry,
  OntimeBaseEvent,
} from 'ontime-types';
import { getLinkedTimes } from 'ontime-utils';

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
      const newLabel = customFieldChangelog.get(field);

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
    (key) => !Object.hasOwn(existingEvent, key) || existingEvent[key] !== newEvent[key],
  );
}
