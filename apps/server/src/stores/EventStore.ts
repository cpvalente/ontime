import { RuntimeStore } from 'ontime-types';

import { socket } from '../adapters/WebsocketAdapter.js';

export type PublishFn = <T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) => void;
export type StoreGetter = <T extends keyof RuntimeStore>(key: T) => Partial<RuntimeStore>[T];

let store: Partial<RuntimeStore> = {};

const changedKeys = new Set<keyof RuntimeStore>();
let isUpdatePending: NodeJS.Immediate | null = null;
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

    // check if the key is already marked for and update otherwise push it onto the update array
    changedKeys.add(key);

    //if there is already and update pending we don't need to schedule another one
    if (!isUpdatePending) {
      isUpdatePending = setImmediate(() => {
        for (const dataKey of changedKeys) {
          socket.sendAsJson({ type: `ontime-${dataKey}`, payload: store[dataKey] });
        }
        socket.sendAsJson({ type: `ontime-flush` });
        isUpdatePending = null;
        changedKeys.clear();
      });
    }
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
