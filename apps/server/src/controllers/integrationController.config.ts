import { LogOrigin, OntimeEvent } from 'ontime-types';
import { EventLoader } from '../classes/event-loader/EventLoader.js';
import { editEvent } from '../services/rundown-service/RundownService.js';
import { coerceString, coerceNumber, coerceBoolean } from '../utils/coerceType.js';
import { logger } from '../classes/Logger.js';

const whitelistedPayload = {
  title: coerceString,
  subtitle: coerceString,
  presenter: coerceString,
  note: coerceString,
  cue: coerceString,

  duration: coerceNumber,

  isPublic: coerceBoolean,
  skip: coerceBoolean,

  colour: coerceString,
  user0: coerceString,
  user1: coerceString,
  user2: coerceString,
  user3: coerceString,
  user4: coerceString,
  user5: coerceString,
  user6: coerceString,
  user7: coerceString,
  user8: coerceString,
  user9: coerceString,
};

export function parse(field: string, value: unknown) {
  if (!whitelistedPayload.hasOwnProperty(field)) {
    throw new Error(`Field ${field} not permitted`);
  }
  const parserFn = whitelistedPayload[field];
  return parserFn(value);
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
  const event = EventLoader.getEventWithId(eventId);

  if (event) {
    let valueToUpdate = newValue;

    // Duration needs to be converted to milliseconds
    if (propertyName === 'duration' && typeof valueToUpdate === 'number') {
      valueToUpdate = valueToUpdate * 1000;
    }

    const propertiesToUpdate = { [propertyName]: valueToUpdate };

    // Handles the special case for duration
    if (propertyName === 'duration') {
      propertiesToUpdate.timeEnd = event.timeStart + (valueToUpdate as number);
    }

    editEvent({ id: eventId, ...propertiesToUpdate });
    logger.info(LogOrigin.Playback, `Updated ${propertyName} of event with ID ${eventId} to ${valueToUpdate}`);
  } else {
    throw new Error(`Event with ID ${eventId} not found`);
  }
}
