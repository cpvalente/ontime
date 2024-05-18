import { OntimeEvent, isKeyOfType, isOntimeEvent } from 'ontime-types';
import { MILLIS_PER_SECOND } from 'ontime-utils';

import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { editEvent } from '../services/rundown-service/RundownService.js';
import { getEventWithId } from '../services/rundown-service/rundownUtils.js';
import { coerceBoolean, coerceColour, coerceNumber, coerceString } from '../utils/coerceType.js';
import { maxDuration } from '../../../../packages/utils/src/date-utils/conversionUtils.js';

const whitelistedPayload = {
  title: coerceString,
  note: coerceString,
  cue: coerceString,

  duration: (value: unknown) => Math.max(coerceNumber(value) * MILLIS_PER_SECOND, maxDuration),

  isPublic: coerceBoolean,
  skip: coerceBoolean,

  colour: coerceColour,

  custom: coerceString,
};

export function parseProperty(property: string, value: unknown) {
  if (property.startsWith('custom:')) {
    const customKey = property.split(':')[1];
    if (!(customKey in DataProvider.getCustomFields())) {
      throw new Error(`Custom field ${customKey} not found`);
    }
    const parserFn = whitelistedPayload.custom;
    return { custom: { [customKey]: parserFn(value) } };
  }

  if (!isKeyOfType(property, whitelistedPayload)) {
    throw new Error(`Property ${property} not permitted`);
  }
  const parserFn = whitelistedPayload[property];
  return { [property]: parserFn(value) };
}

/**
 * Updates a property of the event with the given id
 * @param {Partial<OntimeEvent>} patchEvent
 */
export function updateEvent(patchEvent: Partial<OntimeEvent> & { id: string }) {
  const event = getEventWithId(patchEvent?.id ?? '');
  if (!event) {
    throw new Error(`Event with ID ${patchEvent?.id} not found`);
  }

  if (!isOntimeEvent(event)) {
    throw new Error('Can only update events');
  }

  editEvent(patchEvent);
}
