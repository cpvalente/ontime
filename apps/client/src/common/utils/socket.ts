import { ClientTypes, Log, RuntimeStore } from 'ontime-types';

import { CLIENT_LIST, isProduction, RUNTIME, websocketUrl } from '../api/constants';
import { ontimeQueryClient } from '../queryClient';
import {
  getClientId,
  getClientName,
  setClientId,
  setClientName,
  setClientRedirect,
  setClients,
} from '../stores/clientStore';
import { addLog } from '../stores/logger';
import { patchRuntime, runtimeStore } from '../stores/runtime';

export let websocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
const reconnectInterval = 1000;

export let shouldReconnect = true;
export let hasConnected = false;
export let reconnectAttempts = 0;

export const connectSocket = () => {
  websocket = new WebSocket(websocketUrl);

  const preferredClientName = getClientName();

  websocket.onopen = () => {
    clearTimeout(reconnectTimeout as NodeJS.Timeout);
    hasConnected = true;
    reconnectAttempts = 0;

    if (preferredClientName) {
      socketSendJson('set-client-name', preferredClientName);
      socketSendJson('set-client-type', ClientTypes.Ontime);
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

      switch (type) {
        case 'client-id': {
          if (typeof payload === 'string') {
            setClientId(payload);
          }
          break;
        }

        case 'client-name': {
          if (typeof payload === 'string') {
            setClientName(payload);
          }
          break;
        }

        case 'client-rename': {
          if (payload.id && payload.id === getClientId()) {
            setClientName(payload.name);
          }
          break;
        }

        case 'client-redirect': {
          if (typeof payload === 'object') {
            const id = getClientId();
            if (payload.target && payload.target === id) {
              setClientRedirect(payload.path);
            }
          }
          break;
        }

        case 'client-list': {
          setClients(payload);
          if (!isProduction) {
            ontimeQueryClient.setQueryData(CLIENT_LIST, payload);
          }
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
        case 'ontime-clock': {
          patchRuntime('clock', payload);
          updateDevTools({ clock: payload });
          break;
        }
        case 'ontime-timer': {
          patchRuntime('timer', payload);
          updateDevTools({ timer: payload });
          break;
        }
        case 'ontime-onAir': {
          patchRuntime('onAir', payload);
          updateDevTools({ onAir: payload });
          break;
        }
        case 'ontime-message': {
          patchRuntime('message', payload);
          updateDevTools({ message: payload });
          break;
        }
        case 'ontime-runtime': {
          patchRuntime('runtime', payload);
          updateDevTools({ runtime: payload });
          break;
        }
        case 'ontime-eventNow': {
          patchRuntime('eventNow', payload);
          updateDevTools({ eventNow: payload });
          break;
        }
        case 'ontime-publicEventNow': {
          patchRuntime('publicEventNow', payload);
          updateDevTools({ publicEventNow: payload });
          break;
        }
        case 'ontime-eventNext': {
          patchRuntime('eventNext', payload);
          updateDevTools({ eventNext: payload });
          break;
        }
        case 'ontime-publicEventNext': {
          patchRuntime('publicEventNext', payload);
          updateDevTools({ publicEventNext: payload });
          break;
        }
        case 'ontime-auxtimer1': {
          patchRuntime('auxtimer1', payload);
          updateDevTools({ auxtimer1: payload });
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

function updateDevTools(newData: Partial<RuntimeStore>) {
  if (!isProduction) {
    ontimeQueryClient.setQueryData(RUNTIME, (oldData: RuntimeStore) => ({
      ...oldData,
      ...newData,
    }));
  }
}
