import { Log, RuntimeStore } from 'ontime-types';

import { isProduction, RUNTIME, websocketUrl } from '../api/apiConstants';
import { ontimeQueryClient } from '../queryClient';
import { socketClientName } from '../stores/connectionName';
import { addLog } from '../stores/logger';
import { runtimeStore } from '../stores/runtime';

export let websocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
const reconnectInterval = 1000;
export let shouldReconnect = true;
export let hasConnected = false;
export let reconnectAttempts = 0;
export const connectSocket = (preferredClientName?: string) => {
  websocket = new WebSocket(websocketUrl);

  websocket.onopen = () => {
    clearTimeout(reconnectTimeout as NodeJS.Timeout);
    hasConnected = true;
    reconnectAttempts = 0;

    if (preferredClientName) {
      socketSendJson('set-client-name', preferredClientName);
    }
  };

  websocket.onclose = () => {
    console.warn('WebSocket disconnected');
    if (shouldReconnect) {
      reconnectTimeout = setTimeout(() => {
        console.warn('WebSocket: attempting reconnect');
        if (websocket && websocket.readyState === WebSocket.CLOSED) {
          reconnectAttempts += 1;
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
        case 'client-name': {
          socketClientName.getState().setName(payload);
          break;
        }
        case 'client-list': {
          const state = runtimeStore.getState();
          state.clientList = payload;
          runtimeStore.setState(state);
          console.log(runtimeStore);
          break;
        }
        case 'ontime-log': {
          addLog(payload as Log);
          break;
        }
        case 'ontime': {
          runtimeStore.setState(payload as RuntimeStore);
          if (!isProduction) {
            ontimeQueryClient.setQueryData(RUNTIME, data.payload);
          }
          break;
        }
        case 'ontime-playback': {
          const state = runtimeStore.getState();
          state.timer.playback = payload;
          runtimeStore.setState(state);
          break;
        }
        case 'ontime-timer': {
          const state = runtimeStore.getState();
          state.timer = payload;
          runtimeStore.setState(state);
          break;
        }
        case 'ontime-runtime': {
          const state = runtimeStore.getState();
          state.runtime = payload;
          runtimeStore.setState(state);
          break;
        }
        case 'ontime-message': {
          const state = runtimeStore.getState();
          state.message = payload;
          runtimeStore.setState(state);
          break;
        }
        case 'ontime-onAir': {
          const state = runtimeStore.getState();
          state.onAir = payload;
          runtimeStore.setState(state);
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

export const socketSendJson = (type: string, payload?: unknown) => {
  socketSend(
    JSON.stringify({
      type,
      payload,
    }),
  );
};
