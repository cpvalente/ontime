import { OntimeEvent, isKeyOfType, isOntimeEvent } from 'ontime-types';

import { editEvent } from '../services/rundown-service/RundownService.js';
import { getEventWithId } from '../services/rundown-service/rundownUtils.js';
import { coerceString, coerceNumber, coerceBoolean, coerceColour } from '../utils/coerceType.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';

// TODO: handle custom fields
const whitelistedPayload = {
  title: coerceString,
  note: coerceString,
  cue: coerceString,

  duration: (value) => coerceNumber(value) * 1000, //frontend is seconds based

  isPublic: coerceBoolean,
  skip: coerceBoolean,

  colour: coerceColour,

  custom: coerceString,
};

export function parse(property: string, value: unknown) {
  if (property.startsWith('custom:')) {
    const customKey = property.split(':')[1];
    if (!(customKey in DataProvider.getCustomFields())) {
      throw new Error(`Custom field ${customKey} not found`);
    }
    const parserFn = whitelistedPayload.custom;
    return { custom: { [customKey]: { value: parserFn(value) } } };
  } else {
    if (!isKeyOfType(property, whitelistedPayload)) {
      throw new Error(`Property ${property} not permitted`);
    }
    const parserFn = whitelistedPayload[property];
    return { [property]: parserFn(value) };
  }
}

/**
 * Updates a property of the event with the given id
 * @param {string} eventId
 * @param {Partial<OntimeEvent>} patchEvent
 */
export function updateEvent(eventId: string, patchEvent: Partial<OntimeEvent>) {
  const event = getEventWithId(eventId);
  if (!event) {
    throw new Error(`Event with ID ${eventId} not found`);
  }

  if (!isOntimeEvent(event)) {
    throw new Error('Can only update events');
  }

  editEvent({ id: eventId, ...patchEvent });
}
