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

  throttledSet('message', newState);
  return newState;
}
