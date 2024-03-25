import { EventCustomFields, isKeyOfType, isOntimeEvent, OntimeEvent } from 'ontime-types';

import { editEvent } from '../services/rundown-service/RundownService.js';
import { getEventWithId } from '../services/rundown-service/rundownUtils.js';
import { coerceBoolean, coerceColour, coerceNumber, coerceString } from '../utils/coerceType.js';
import { getCustomFields } from '../services/rundown-service/rundownCache.js';

// TODO: handle custom fields
const whitelistedPayload = {
  title: coerceString,
  note: coerceString,
  cue: coerceString,

  duration: coerceNumber,

  isPublic: coerceBoolean,
  skip: coerceBoolean,

  colour: coerceColour,

  custom: coerceCustom,
};

function coerceCustom(value: unknown): EventCustomFields {
  const customValue = value as { value: unknown; customProperty: string; type: 'string' };
  switch (customValue.type) {
    case 'string':
      return {
        [customValue.customProperty]: {
          value: coerceString(customValue.value,
          ),
        },
      };
  }
  throw new Error('Unable to parese custom value');
}

export function parse(property: string, value: unknown) {
  if (property.startsWith('custom:')) {
    const customProperty = property.split(':')[1];
    property = property.split(':')[0];
    const customFields = getCustomFields();
    if (!Object.hasOwn(customFields, customProperty)) {
      throw new Error(`Property ${customProperty} not found in available custom fields`);
    }
    const { type } = customFields[customProperty];
    value = { value, customProperty, type };
  }
  if (!isKeyOfType(property, whitelistedPayload)) {
    throw new Error(`Property ${property} not permitted`);
  }
  const parserFn = whitelistedPayload[property];
  return { parsedProperty: property, parsedPayload: parserFn(value) };
}

/**
 * Updates a property of the event with the given id
 * @param {string} eventId
 * @param {keyof OntimeEvent} propertyName
 * @param {OntimeEvent[typeof propertyName]} newValue
 */
export function updateEvent(
  eventId: string,
  propertyName: keyof OntimeEvent,
  newValue: OntimeEvent[typeof propertyName],
) {
  const event = getEventWithId(eventId);
  if (!event) {
    throw new Error(`Event with ID ${eventId} not found`);
  }

  if (!isOntimeEvent(event)) {
    throw new Error('Can only update events');
  }

  const propertiesToUpdate = { [propertyName]: newValue };

  // Handles the special case for duration
  // needs to be converted to milliseconds
  if (propertyName === 'duration') {
    propertiesToUpdate.duration = (newValue as number) * 1000;
    propertiesToUpdate.timeEnd = event.timeStart + propertiesToUpdate.duration;
  }

  const newEvent = editEvent({ id: eventId, ...propertiesToUpdate });
  return newEvent;
}
