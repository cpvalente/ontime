import { CustomFields, EndAction, OntimeEntry, TimeStrategy, TimerType, isKeyOfType } from 'ontime-types';
import { maxDuration } from 'ontime-utils';

import { coerceBoolean, coerceColour, coerceEnum, coerceNumber, coerceString } from '../utils/coerceType.js';

/**
 *
 * @param {number} value time amount in milliseconds
 * @returns {number} time in milliseconds clamped to 0 and max duration
 */
function clampDuration(value: number): number {
  if (value > maxDuration || value < 0) {
    throw new Error('Times should be from 0 to 23:59:59');
  }
  return value;
}

const propertyConversion: Record<string, (value: unknown) => unknown> = {
  title: coerceString,
  note: coerceString,
  cue: coerceString,

  skip: coerceBoolean,
  flag: coerceBoolean,
  countToEnd: coerceBoolean,

  colour: coerceColour,

  custom: coerceString,

  timeWarning: (value: unknown) => clampDuration(coerceNumber(value)),
  timeDanger: (value: unknown) => clampDuration(coerceNumber(value)),

  endAction: (value: unknown) => coerceEnum<EndAction>(value, EndAction),
  timerType: (value: unknown) => coerceEnum<TimerType>(value, TimerType),

  linkStart: coerceBoolean,
  timeStrategy: (value: unknown) => coerceEnum<TimeStrategy>(value, TimeStrategy),

  targetDuration: (value: unknown) => clampDuration(coerceNumber(value)), // only exist in the group
  duration: (value: unknown) => clampDuration(coerceNumber(value)),
  timeStart: (value: unknown) => clampDuration(coerceNumber(value)),
  timeEnd: (value: unknown) => clampDuration(coerceNumber(value)),
};

/**
 * coerces a property of an Ontime Entry
 * @throws if the value does not conform to the expected type
 */
export function parseProperty(property: string, value: unknown) {
  if (property.startsWith('custom:')) {
    // custom fields have been validated when used here
    const customKey = property.split(':')[1];
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
 * Checks wether a valid property - value pair are applicable to an entry
 */
export function isValidChangeProperty(
  target: OntimeEntry,
  property: string,
  value: unknown,
  customFields: CustomFields,
): boolean {
  if (typeof property !== 'string') return false;
  if (value === undefined) return false;
  if (property.startsWith('custom:') && Object.hasOwn(target, 'custom')) {
    const customProperty = property.slice('custom:'.length);
    if (!customProperty) return false;
    return Object.hasOwn(customFields, customProperty);
  }
  return Object.hasOwn(target, property);
}
