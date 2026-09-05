import { MessageState, runtimeStorePlaceholder } from 'ontime-types';
import { withoutUndefinedValues } from 'ontime-utils';
import { DeepPartial } from 'ts-essentials';

import type { PublishFn, StoreGetter } from '../../stores/EventStore.js';
import { throttle } from '../../utils/throttle.js';

/**
 * Create a throttled version of the set function
 */
let throttledSet: PublishFn = () => undefined;
let storeGet: StoreGetter = (_key: string) => undefined;

/**
 * Allows providing store interfaces
 */
export function init(storeSetter: PublishFn, storeGetter: StoreGetter) {
  throttledSet = throttle(storeSetter, 100);
  storeGet = storeGetter;
}

/**
 * Exposes function to reset the internal state
 */
export function clear() {
  throttledSet('message', {
    ...runtimeStorePlaceholder.message,
  });
}

/**
 * Exposes the internal state of the message service
 */
export function getState(): MessageState {
  // we know this exists at runtime
  return storeGet('message') as MessageState;
}

/**
 * Utility function allows patching internal object
 */
export function patch(patch: DeepPartial<MessageState>): MessageState {
  // make a copy of the state in store
  const newState = { ...getState() };

  if (patch.timer !== undefined) {
    const sanitisedTimer = withoutUndefinedValues(patch.timer);
    newState.timer = { ...newState.timer, ...sanitisedTimer };
  }
  if ('secondary' in patch && patch.secondary !== undefined) newState.secondary = patch.secondary;
  if (patch.question !== undefined) {
    const { enabled, target, answers, answer } = patch.question;
    newState.question = {
      enabled: enabled ?? newState.question.enabled,
      target: target !== undefined ? target : newState.question.target,
      answers:
        answers !== undefined
          ? answers.filter((option): option is string => option !== undefined)
          : newState.question.answers,
      // arming a question always starts from a clean slate, regardless of what else is in this patch
      answer: enabled === true ? null : answer !== undefined ? answer : newState.question.answer,
    };
  }

  throttledSet('message', newState);
  return newState;
}

// keep in sync with ANSWER_HOLD_MS in apps/client/src/views/timer/Timer.tsx,
// so the controller's own view of the question (eye, ? icon) doesn't go stale before the viewer's does
const ANSWER_HOLD_MS = 2000;

// bumped on every recordAnswer() call so a stale timeout can tell it is no longer the latest one,
// even if a later answer happens to repeat the same text (eg two "Yes" answers in separate cycles)
let answerToken = 0;

/**
 * Records an answer to the currently active question
 * The answer is shown immediately, but the question (and secondary message) only clears
 * after a delay, so the controller stays in sync with the viewer holding it on screen
 * @param clientId the id of the websocket client sending the answer, if known. When provided,
 * the answer is rejected unless it comes from the currently targeted client. OSC/HTTP callers
 * have no client identity to check, so this is left unverified for those (undefined clientId)
 * @throws if there is no active question to answer, one has already been recorded,
 * or clientId is provided and does not match the targeted client
 */
export function recordAnswer(value: string, clientId?: string): MessageState {
  const currentState = getState();
  if (!currentState.question.enabled || currentState.question.answer !== null) {
    throw new Error('No active question to answer');
  }
  if (clientId !== undefined && currentState.question.target !== clientId) {
    throw new Error('This answer was not sent by the targeted client');
  }

  const newState = { ...currentState };
  newState.question = { ...currentState.question, answer: value };

  const token = ++answerToken;
  setTimeout(() => {
    // a newer answer has been recorded since this one was scheduled - let its own timeout handle the clear
    if (token !== answerToken) {
      return;
    }
    // only auto-clear if nothing has re-armed, answered again, or been dismissed manually since
    const latest = getState();
    if (latest.question.enabled && latest.question.answer === value) {
      const resetState = { ...latest };
      resetState.question = { ...latest.question, enabled: false };
      resetState.timer = { ...latest.timer, secondarySource: null };
      throttledSet('message', resetState);
    }
  }, ANSWER_HOLD_MS);

  throttledSet('message', newState);
  return newState;
}
