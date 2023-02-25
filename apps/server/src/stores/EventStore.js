import { socketProvider } from '../classes/socket/SocketController.js';

const store = {};

/**
 * A runtime store that broadcasts its payload
 */
export const eventStore = {
  get(key) {
    return store[key];
  },
  set(key, value) {
    store[key] = value;
    socketProvider.send(key, value);
  },
  poll() {
    return store;
  },
  broadcast() {
    socketProvider.send(store);
    socketProvider.broadcastState();
  },
};
