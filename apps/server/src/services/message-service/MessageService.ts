import { MessageState, runtimeStorePlaceholder } from 'ontime-types';
import { DeepPartial } from 'ts-essentials';

import { throttle } from '../../utils/throttle.js';
import { eventStore, type PublishFn } from '../../stores/EventStore.js';

/**
 * Create a throttled version of the set function
 */
const throttledSet: PublishFn = throttle(eventStore.set, 100);

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
  return eventStore.get('message');
}

/**
 * Utility function allows patching internal object
 */
export function patch(patch: DeepPartial<MessageState>): MessageState {
  // make a copy of the state in store
  const newState = { ...getState() };

  if ('timer' in patch) newState.timer = { ...newState.timer, ...patch.timer };
  if ('external' in patch && patch.external !== undefined) newState.external = patch.external;

  throttledSet('message', newState);
  return newState;
}
