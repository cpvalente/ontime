import { Playback, RuntimeStore } from 'ontime-types';
import { socket } from '../adapters/WebsocketAdapter.js';
import { eventTimer } from '../services/TimerService.js';
import { messageService } from '../services/message-service/MessageService.js';
import { eventLoader } from '../classes/event-loader/EventLoader.js';

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

/**
 * Module initialises the services and provides initial payload for the store
 * Currently registered objects in store
 * - Timer Service      timer
 * - Timer Service      playback
 * - Timer Service      onAir
 * - Message Service    timerMessage
 * - Message Service    publicMessage
 * - Message Service    lowerMessage
 * - Event Loader       loaded
 * - Event Loader       eventNow
 * - Event Loader       publicEventNow
 * - Event Loader       eventNext
 * - Event Loader       publicEventNext
 */

export const getInitialPayload = () => ({
  timer: eventTimer.timer,
  playback: eventTimer.playback,
  onAir: eventTimer.playback !== Playback.Stop,
  timerMessage: messageService.timerMessage,
  publicMessage: messageService.publicMessage,
  lowerMessage: messageService.lowerMessage,
  externalMessage: messageService.externalMessage,
  loaded: eventLoader.loaded,
  eventNow: eventLoader.eventNow,
  publicEventNow: eventLoader.publicEventNow,
  eventNext: eventLoader.eventNext,
  publicEventNext: eventLoader.publicEventNext,
});
