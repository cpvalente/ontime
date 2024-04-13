import { Message, TimerMessage } from 'ontime-types';

import * as assert from '../../utils/assert.js';
import { coerceBoolean, coerceString } from '../../utils/coerceType.js';

/**
 * Creates a valid Message object from a payload
 * @throws if the payload is not an object
 */
export function validateMessage(message: unknown): Partial<Message> {
  assert.isObject(message);

  const result: Partial<Message> = {};
  if ('text' in message) result.text = coerceString(message.text);
  if ('visible' in message) result.visible = coerceBoolean(message.visible);

  return result;
}

/**
 * Creates a valid Timer Message object from a payload
 * @throws if the payload is not an object
 */
export function validateTimerMessage(message: unknown): Partial<TimerMessage> {
  assert.isObject(message);

  const result: Partial<TimerMessage> = {};

  if ('text' in message) result.text = coerceString(message.text);
  if ('visible' in message) result.visible = coerceBoolean(message.visible);
  if ('blink' in message) result.blink = coerceBoolean(message.blink);
  if ('blackout' in message) result.blackout = coerceBoolean(message.blackout);

  return result;
}
