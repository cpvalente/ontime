import { RuntimeStore } from 'ontime-types';

import { socketProvider } from '../classes/socket/SocketController.js';

const store: Partial<RuntimeStore> = {};

/**
 * A runtime store that broadcasts its payload
 */
export const eventStore = {
  get<T extends keyof RuntimeStore>(key: T) {
    return store[key];
  },
  set<T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) {
    store[key] = value;
    socketProvider.send(key, value);
  },
  poll() {
    return store;
  },
  broadcast() {
    socketProvider.send(store);
  },
};
