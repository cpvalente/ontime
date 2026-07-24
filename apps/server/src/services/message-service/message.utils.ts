import { MessageQuestion, TimerMessage } from 'ontime-types';

import * as assert from '../../utils/assert.js';
import { coerceBoolean, coerceString } from '../../utils/coerceType.js';

const MAX_ANSWER_OPTIONS = 3;
const MAX_ANSWER_LENGTH = 40;

/**
 * Creates a valid Message object from a payload
 * @throws if the payload is not an object
 */
export function validateMessage(message: unknown): string {
  return decodeURI(coerceString(message));
}

/**
 * Creates a valid answer value from a payload
 * @throws if the payload is not a string
 */
export function validateAnswer(answer: unknown): string {
  return decodeURI(coerceString(answer));
}

/**
 * Creates a valid partial Question object from a payload
 * @throws if the payload is not an object
 */
export function validateQuestion(question: unknown): Partial<MessageQuestion> {
  assert.isObject(question);

  const result: Partial<MessageQuestion> = {};

  if ('enabled' in question) result.enabled = coerceBoolean(question.enabled);
  if ('target' in question) result.target = question.target === null ? null : decodeURI(coerceString(question.target));
  if ('answers' in question) result.answers = coerceAnswerOptions(question.answers);
  if ('answer' in question) result.answer = question.answer === null ? null : decodeURI(coerceString(question.answer));

  return result;
}

/**
 * Ensures a list of button labels is a bounded list of short strings
 */
function coerceAnswerOptions(value: unknown): string[] {
  assert.isArray(value);
  return value
    .slice(0, MAX_ANSWER_OPTIONS)
    .map((option) => decodeURI(coerceString(option)).slice(0, MAX_ANSWER_LENGTH));
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
  return source === 'aux1' || source === 'aux2' || source === 'aux3' || source === 'secondary' || source === null;
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
