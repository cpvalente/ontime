import { RuntimeStore } from 'ontime-types';

import { socket } from '../adapters/WebsocketAdapter.js';

export type PublishFn = <T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) => void;
export type StoreGetter = <T extends keyof RuntimeStore>(key: T) => Partial<RuntimeStore>[T];

let store: Partial<RuntimeStore> = {};

/**
 * A runtime store that broadcasts its payload
 * - init: allows for adding an initial payload to the store
 * - batchSet: allows setting several keys with a single broadcast
 * - poll: utility to return state
 * - broadcast: send its payload as json object
 */
export const eventStore = {
  init(payload: RuntimeStore) {
    store = payload;
  },
  get<T extends keyof RuntimeStore>(key: T) {
    return store[key];
  },
  set<T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) {
    store[key] = value;
    socket.sendAsJson({
      type: `ontime-${key}`,
      payload: value,
    });
  },
  batchSet(values: Partial<RuntimeStore>) {
    Object.entries(values).forEach(([key, value]) => {
      store[key] = value;
    });
    this.broadcast();
  },
  poll() {
    return store as RuntimeStore;
  },
  broadcast() {
    socket.sendAsJson({
      type: 'ontime',
      payload: store,
    });
  },
};
