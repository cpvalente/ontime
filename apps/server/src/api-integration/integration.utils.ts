import { EndAction, OntimeEvent, TimerType, isKeyOfType, isOntimeEvent } from 'ontime-types';
import { MILLIS_PER_SECOND, maxDuration } from 'ontime-utils';

import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { editEvent } from '../services/rundown-service/RundownService.js';
import { getEventWithId } from '../services/rundown-service/rundownUtils.js';
import { coerceBoolean, coerceColour, coerceEnum, coerceNumber, coerceString } from '../utils/coerceType.js';

/**
 *
 * @param {number} value time amount in seconds
 * @returns {number} time in milliseconds clamped to 0 and max duration
 */
function clampToMaxDuration(value: number) {
  const valueInMillis = value * MILLIS_PER_SECOND;
  if (valueInMillis > maxDuration || valueInMillis < 0) {
    throw new Error('Times should be from 0 to 23:59:59');
  }
  return valueInMillis;
}

const propertyConversion = {
  title: coerceString,
  note: coerceString,
  cue: coerceString,

  isPublic: coerceBoolean,
  skip: coerceBoolean,

  colour: coerceColour,

  custom: coerceString,

  timeWarning: (value: unknown) => clampToMaxDuration(coerceNumber(value)),
  timeDanger: (value: unknown) => clampToMaxDuration(coerceNumber(value)),

  endAction: (value: unknown) => coerceEnum<EndAction>(value, Object.values(EndAction)),
  timerType: (value: unknown) => coerceEnum<TimerType>(value, Object.values(TimerType)),

  duration: (value: unknown) => clampToMaxDuration(coerceNumber(value)),
  timeStart: (value: unknown) => clampToMaxDuration(coerceNumber(value)),
  timeEnd: (value: unknown) => clampToMaxDuration(coerceNumber(value)),
};

export function parseProperty(property: string, value: unknown) {
  if (property.startsWith('custom:')) {
    const customKey = property.split(':')[1].toLocaleLowerCase(); // all custom fields keys are lowercase
    if (!(customKey in DataProvider.getCustomFields())) {
      throw new Error(`Custom field ${customKey} not found`);
    }
    const parserFn = propertyConversion.custom;
    return { custom: { [customKey]: parserFn(value) } };
  }
  if (!isKeyOfType(property, propertyConversion)) {
    throw new Error(`Property ${property} not permitted`);
  }
  const parserFn = propertyConversion[property];
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
