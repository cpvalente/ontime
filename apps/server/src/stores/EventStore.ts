import { RuntimeStore } from 'ontime-types';
import { socket } from '../adapters/WebsocketAdapter.js';

export type PublishFn = <T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) => void;

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
    // TODO: Partial updates seems to cause issues on the client
    // socket.send({
    //   type: `ontime-${key}`,
    //   payload: value,
    // });
    this.broadcast();
  },
  batchSet<K extends keyof RuntimeStore>(values: Record<K, RuntimeStore[K]>) {
    Object.entries(values).forEach(([key, value]) => {
      store[key] = value;
    });
    this.broadcast();
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
