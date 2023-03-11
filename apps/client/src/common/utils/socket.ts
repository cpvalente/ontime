import deepmerge from 'deepmerge';
import { Log } from 'ontime-types';

import { websocketUrl } from '../api/apiConstants';
import { logger, LOGGER_MAX_MESSAGES } from '../stores/logger';
import { runtime } from '../stores/runtime';

export let websocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
const reconnectInterval = 1000;
let shouldReconnect = true;

export const connectSocket = () => {
  websocket = new WebSocket(websocketUrl);

  websocket.onopen = () => {
    clearTimeout(reconnectTimeout as NodeJS.Timeout);
  };

  websocket.onclose = () => {
    console.warn('WebSocket disconnected');
    if (shouldReconnect) {
      reconnectTimeout = setTimeout(() => {
        console.warn('WebSocket: attempting reconnect');
        if (websocket && websocket.readyState === WebSocket.CLOSED) {
          connectSocket();
        }
      }, reconnectInterval);
    }
  };

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      const { type, payload } = data;

      if (!type) {
        return;
      }

      // TODO: implement partial store updates
      switch (type) {
        case 'ontime-log': {
          const state = logger.get();
          state.unshift(payload as Log);

          if (state.length > LOGGER_MAX_MESSAGES) {
            state.splice(LOGGER_MAX_MESSAGES + 1, state.length - LOGGER_MAX_MESSAGES - 1);
          }
          logger.set(state);
          break;
        }
        case 'ontime': {
          const storeState = runtime.get();
          const newState = deepmerge(storeState, payload);
          runtime.set(newState);
          break;
        }
        case 'ontime-playback': {
          const state = runtime.get();
          state.playback = payload;
          runtime.set(state);
          break;
        }
        case 'ontime-timer': {
          const state = runtime.get();
          state.timer = payload;
          runtime.set(state);
          break;
        }
        case 'ontime-loaded': {
          const state = runtime.get();
          state.loaded = payload;
          runtime.set(state);
          break;
        }
        case 'ontime-titles': {
          const state = runtime.get();
          state.titles = payload;
          runtime.set(state);
          break;
        }
        case 'ontime-titlesPublic': {
          const state = runtime.get();
          state.titlesPublic = payload;
          runtime.set(state);
          break;
        }
        case 'ontime-timerMessage': {
          const state = runtime.get();
          state.timerMessage = payload;
          runtime.set(state);
          break;
        }
        case 'ontime-publicMessage': {
          const state = runtime.get();
          state.publicMessage = payload;
          runtime.set(state);
          break;
        }
        case 'ontime-lowerMessage': {
          const state = runtime.get();
          state.lowerMessage = payload;
          runtime.set(state);
          break;
        }
        case 'ontime-onAir': {
          const state = runtime.get();
          state.onAir = payload;
          runtime.set(state);
          break;
        }
      }
    } catch (_) {
      // ignore unhandled
    }
  };
};

export const disconnectSocket = () => {
  shouldReconnect = false;
  websocket?.close();
};

export const socketSend = (message: any) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(message);
  }
};

export const socketSendJson = (type: string, payload?: any) => {
  socketSend(
    JSON.stringify({
      type,
      payload,
    }),
  );
};
