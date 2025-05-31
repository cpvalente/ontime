import { RuntimeStore, MessageType } from 'ontime-types';

import { socket } from '../adapters/WebsocketAdapter.js';
import { isEmptyObject } from '../utils/parserUtils.js';

export type PublishFn = <T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) => void;
export type StoreGetter = <T extends keyof RuntimeStore>(key: T) => Partial<RuntimeStore>[T];

let store: Partial<RuntimeStore> = {};

/**
 * A runtime store that broadcasts its payload
 * - init: allows for adding an initial payload to the store
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
    socket.sendAsJson({ type: MessageType.RuntimePatch, payload: { [key]: value } });
  },
  createBatch() {
    const patch: Partial<RuntimeStore> = {};
    return {
      add<T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) {
        patch[key] = value;
      },
      send() {
        if (isEmptyObject(patch)) return;
        store = { ...store, ...patch };
        socket.sendAsJson({ type: MessageType.RuntimePatch, payload: patch });
      },
    };
  },
  poll() {
    return store as RuntimeStore;
  },
  broadcast() {
    socket.sendAsJson({
      type: MessageType.RuntimeData,
      payload: store as RuntimeStore, // We assume that it has been initialized at this point
    });
  },
};
