import { OntimeEvent, isKeyOfType, isOntimeEvent } from 'ontime-types';
import { MILLIS_PER_SECOND, maxDuration } from 'ontime-utils';

import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { editEvent } from '../services/rundown-service/RundownService.js';
import { getEventWithId } from '../services/rundown-service/rundownUtils.js';
import { coerceBoolean, coerceColour, coerceNumber, coerceString } from '../utils/coerceType.js';

const defaultWhitelist = {
  title: coerceString,
  note: coerceString,
  cue: coerceString,

  isPublic: coerceBoolean,
  skip: coerceBoolean,

  colour: coerceColour,

  custom: coerceString,
};

const timerWhitelist = {
  ...defaultWhitelist,
  duration: (value: unknown) => Math.max(0, Math.min(coerceNumber(value) * MILLIS_PER_SECOND, maxDuration)),
  timeStart: (value: unknown) => Math.max(0, Math.min(coerceNumber(value) * MILLIS_PER_SECOND, maxDuration)),
  timeEnd: (value: unknown) => Math.max(0, Math.min(coerceNumber(value) * MILLIS_PER_SECOND, maxDuration)),
};

function getWhitelist() {
  if (DataProvider.getSettings().apiAllowTimeChange) {
    return timerWhitelist;
  }

  return defaultWhitelist;
}

export function parseProperty(property: string, value: unknown) {
  const whitelist = getWhitelist();
  if (property.startsWith('custom:')) {
    const customKey = property.split(':')[1].toLocaleLowerCase(); // all custom fields keys are lowercase
    if (!(customKey in DataProvider.getCustomFields())) {
      throw new Error(`Custom field ${customKey} not found`);
    }
    const parserFn = whitelist.custom;
    return { custom: { [customKey]: parserFn(value) } };
  }
  if (!isKeyOfType(property, whitelist)) {
    throw new Error(`Property ${property} not permitted`);
  }
  const parserFn = whitelist[property];
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
  console.log(patchEvent);
  editEvent(patchEvent);
}
