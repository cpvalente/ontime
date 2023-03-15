import { RuntimeStore } from 'ontime-types';
import { socket } from '../adapters/WebsocketAdapter.js';

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
    // TODO: Partial updates seems to cause issues on the client
    // socket.send({
    //   type: `ontime-${key}`,
    //   payload: value,
    // });
    this.broadcast();
  },
  poll() {
    return store;
  },
  broadcast() {
    socket.send({
      type: 'ontime',
      payload: store,
    });
  },
};
