import { RuntimeStore } from 'ontime-types';

const store: Partial<RuntimeStore> = {};

/**
 * A runtime store that broadcasts its payload
 */
// TODO: misses callback to send stuff
export const eventStore = {
  get<T extends keyof RuntimeStore>(key: T) {
    return store[key];
  },
  set<T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) {
    store[key] = value;
    // socketProvider.send(key, value);
  },
  poll() {
    return store;
  },
  broadcast() {
    // socketProvider.send(store);
  },
};
