import { TimerMessage } from 'ontime-types';

import * as assert from '../../utils/assert.js';
import { coerceBoolean, coerceString } from '../../utils/coerceType.js';

/**
 * Creates a valid Message object from a payload
 * @throws if the payload is not an object
 */
export function validateMessage(message: unknown): string {
  return decodeURI(coerceString(message));
}

/**
 * Creates a valid Timer Message object from a payload
 * @throws if the payload is not an object
 */
export function validateTimerMessage(message: unknown): Partial<TimerMessage> {
  assert.isObject(message);

  const result: Partial<TimerMessage> = {};

  if ('text' in message) result.text = decodeURI(coerceString(message.text));
  if ('visible' in message) result.visible = coerceBoolean(message.visible);
  if ('blink' in message) result.blink = coerceBoolean(message.blink);
  if ('blackout' in message) result.blackout = coerceBoolean(message.blackout);
  if ('secondarySource' in message) result.secondarySource = coerceSecondary(message.secondarySource);

  return result;
}

/**
 * Asserts that the secondary value is one of the permitted values
 */
function assertSecondary(source: unknown): source is TimerMessage['secondarySource'] {
  return source === 'aux' || source === 'secondary' || source === null;
}

/**
 * Ensures that the secondary value is one of the permitted values
 */
function coerceSecondary(source: unknown): TimerMessage['secondarySource'] {
  if (!assertSecondary(source)) {
    return null;
  }
  return source;
}
