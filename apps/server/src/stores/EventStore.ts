import { RuntimeStore, MessageTag, runtimeStorePlaceholder, SimplePlayback, SimpleDirection } from 'ontime-types';

import { socket } from '../adapters/WebsocketAdapter.js';
import { isEmptyObject } from '../utils/parserUtils.js';
import { runtimeState } from './runtimeState.js';
import { timerConfig } from '../setup/config.js';

export type PublishFn = <T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) => void;
export type StoreGetter = <T extends keyof RuntimeStore>(key: T) => Partial<RuntimeStore>[T];

let store: Partial<RuntimeStore> = {};

function mapRuntimeState(): RuntimeStore {
  return {
    clock: runtimeState.clock,
    timer: structuredClone(runtimeState.timer),
    message: structuredClone(runtimeStorePlaceholder.message),
    offset: structuredClone(runtimeState.offset),
    rundown: structuredClone(runtimeState.rundown),
    eventNow: structuredClone(runtimeState.eventNow),
    eventNext: structuredClone(runtimeState.eventNext),
    eventFlag: null,
    groupNow: null,
    auxtimer1: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    auxtimer2: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    auxtimer3: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    ping: 1,
  };
}
/**
 * A runtime store that broadcasts its payload
 * - init: allows for adding an initial payload to the store
 * - poll: utility to return state
 * - broadcast: send its payload as json object
 */
export const eventStore = {
  init() {
    store = mapRuntimeState();
  },
  get<T extends keyof RuntimeStore>(key: T) {
    return store[key];
  },
  set<T extends keyof RuntimeStore>(key: T, value: RuntimeStore[T]) {
    store[key] = value;
    socket.sendAsJson(MessageTag.RuntimeData, { [key]: value });
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
        socket.sendAsJson(MessageTag.RuntimeData, patch);
      },
    };
  },
  poll() {
    return store as RuntimeStore;
  },
  broadcast() {
    socket.sendAsJson(
      MessageTag.RuntimeData,
      store as RuntimeStore, // We assume that it has been initialized at this point
    );
  },
};
