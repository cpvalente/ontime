import { OntimeEvent, isKeyOfType, isOntimeEvent } from 'ontime-types';

import { editEvent } from '../services/rundown-service/RundownService.js';
import { getEventWithId } from '../services/rundown-service/rundownUtils.js';
import { coerceString, coerceNumber, coerceBoolean, coerceColour } from '../utils/coerceType.js';

// TODO: handle custom fields
const whitelistedPayload = {
  title: coerceString,
  note: coerceString,
  cue: coerceString,

  duration: coerceNumber,

  isPublic: coerceBoolean,
  skip: coerceBoolean,

  colour: coerceColour,
};

export function parse(property: string, value: unknown) {
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
