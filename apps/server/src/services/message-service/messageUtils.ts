import { Message, TimerMessage } from 'ontime-types';

import * as assert from '../../utils/assert.js';
import { coerceBoolean, coerceString } from '../../utils/coerceType.js';

/**
 * Creates a valid Message object from a payload
 * @throws if the payload is not an object
 */
export function validateMessage(message: unknown): Partial<Message> {
  assert.isObject(message);

  return {
    text: 'text' in message ? coerceString(message.text) : undefined,
    visible: 'visible' in message ? coerceBoolean(message.visible) : undefined,
  };
}

/**
 * Creates a valid Timer Message object from a payload
 * @throws if the payload is not an object
 */
export function validateTimerMessage(message: unknown): Partial<TimerMessage> {
  assert.isObject(message);

  return {
    text: 'text' in message ? coerceString(message.text) : undefined,
    visible: 'visible' in message ? coerceBoolean(message.visible) : undefined,
    blink: 'blink' in message ? coerceBoolean(message.blink) : undefined,
    blackout: 'blackout' in message ? coerceBoolean(message.blackout) : undefined,
  };
}
