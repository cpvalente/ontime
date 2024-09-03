import { TimerMessage, MessageState } from 'ontime-types';
import { DeepPartial } from 'ts-essentials';

import { throttle } from '../../utils/throttle.js';
import type { PublishFn } from '../../stores/EventStore.js';

const defaultTimer: TimerMessage = {
  text: '',
  visible: false,
  blink: false,
  blackout: false,
  secondarySource: null,
};

let timer = { ...defaultTimer };
let external = '';

let throttledSet: PublishFn | null = null;

/**
 * Initialises the message service with a publish function
 * @param publishFn
 */
export function init(publishFn: PublishFn) {
  throttledSet = throttle(publishFn, 100);
}

/**
 * Exposes function to reset the internal state
 */
export function clear() {
  timer = { ...defaultTimer };
  external = '';
}

/**
 * Exposes the internal state of the message service
 */
export function getState(): MessageState {
  return {
    external,
    timer,
  };
}

/**
 * Utility function allows patching internal object
 */
export function patch(patch: DeepPartial<MessageState>): MessageState {
  // we cannot call patch before init
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (throttledSet === null) {
      throw new Error('MessageService.patch() called before init()');
    }
  }

  if ('timer' in patch) timer = { ...timer, ...patch.timer };
  if ('external' in patch && patch.external !== undefined) external = patch.external;
  const newState = getState();
  throttledSet?.('message', newState);
  return newState;
}
