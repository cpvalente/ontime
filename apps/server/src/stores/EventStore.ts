import { RuntimeStore } from 'ontime-types';

import { socket } from '../adapters/WebsocketAdapter.js';

export type PublishFn = <T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) => void;
export type StoreGetter = <T extends keyof RuntimeStore>(key: T) => Partial<RuntimeStore>[T];

let store: Partial<RuntimeStore> = {};

const changedKeys = new Array<keyof RuntimeStore>();
let trigger: NodeJS.Immediate | null = null;
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
    if (!changedKeys.includes(key)) changedKeys.push(key);
    if (!trigger) {
      trigger = setImmediate(() => {
        socket.sendRuntimeStoreUpdate(changedKeys, store);
        trigger = null;
      });
    }
  },
  poll() {
    return store;
  },
  broadcast() {
    socket.sendAsJson({
      type: 'ontime',
      payload: store,
    });
  },
};
