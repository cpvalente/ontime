import { OntimeEvent, isOntimeEvent, OntimeRundown, CustomFieldLabel, CustomFields } from 'ontime-types';
import { getLinkedTimes } from 'ontime-utils';

/**
 * Get linked event
 */
export function getLink(currentIndex: number, rundown: OntimeRundown): OntimeEvent | null {
  // currently the link is the previous event
  for (let i = currentIndex - 1; i >= 0; i--) {
    const event = rundown[i];
    if (isOntimeEvent(event)) {
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
  customFieldChangelog: Record<string, string>,
  mutableEvent: OntimeEvent,
  assignedCustomFields: Record<string, string[]>,
) {
  for (const field in mutableEvent.custom) {
    // rename the property if it is in the changelog
    if (field in customFieldChangelog) {
      const oldData = mutableEvent.custom[field];
      const newLabel = customFieldChangelog[field];

      mutableEvent.custom[newLabel] = { ...oldData };
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
