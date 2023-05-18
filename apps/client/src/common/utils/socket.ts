import { Log, RuntimeStore } from 'ontime-types';

import { RUNTIME, websocketUrl } from '../api/apiConstants';
import { ontimeQueryClient } from '../queryClient';
import { addLog } from '../stores/logger';
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
          addLog(payload as Log);
          break;
        }
        case 'ontime': {
          runtime.setState(payload as RuntimeStore);
          if (import.meta.env.DEV) {
            ontimeQueryClient.setQueryData(RUNTIME, data.payload);
          }
          break;
        }
        case 'ontime-playback': {
          const state = runtime.getState();
          state.playback = payload;
          runtime.setState(state);
          break;
        }
        case 'ontime-timer': {
          const state = runtime.getState();
          state.timer = payload;
          runtime.setState(state);
          break;
        }
        case 'ontime-loaded': {
          const state = runtime.getState();
          state.loaded = payload;
          runtime.setState(state);
          break;
        }
        case 'ontime-titles': {
          const state = runtime.getState();
          state.titles = payload;
          runtime.setState(state);
          break;
        }
        case 'ontime-titlesPublic': {
          const state = runtime.getState();
          state.titlesPublic = payload;
          runtime.setState(state);
          break;
        }
        case 'ontime-timerMessage': {
          const state = runtime.getState();
          state.timerMessage = payload;
          runtime.setState(state);
          break;
        }
        case 'ontime-publicMessage': {
          const state = runtime.getState();
          state.publicMessage = payload;
          runtime.setState(state);
          break;
        }
        case 'ontime-lowerMessage': {
          const state = runtime.getState();
          state.lowerMessage = payload;
          runtime.setState(state);
          break;
        }
        case 'ontime-onAir': {
          const state = runtime.getState();
          state.onAir = payload;
          runtime.setState(state);
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
