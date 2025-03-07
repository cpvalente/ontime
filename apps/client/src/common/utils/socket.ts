import { Log, RundownCached, RuntimeStore } from 'ontime-types';

import { isProduction, websocketUrl } from '../../externals';
import { CLIENT_LIST, CUSTOM_FIELDS, REPORT, RUNDOWN, RUNTIME } from '../api/constants';
import { invalidateAllCaches } from '../api/utils';
import { ontimeQueryClient } from '../queryClient';
import {
  getClientId,
  getClientName,
  setClientId,
  setClientName,
  setClientRedirect,
  setClients,
} from '../stores/clientStore';
import { addDialog } from '../stores/dialogStore';
import { addLog } from '../stores/logger';
import { addToBatchUpdates, flushBatchUpdates, patchRuntime, patchRuntimeProperty } from '../stores/runtime';

let websocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
const reconnectInterval = 1000;

export let hasConnected = false;
export let reconnectAttempts = 0;

export const connectSocket = () => {
  websocket = new WebSocket(websocketUrl);

  const preferredClientName = getClientName();

  websocket.onopen = () => {
    clearTimeout(reconnectTimeout as NodeJS.Timeout);
    hasConnected = true;
    reconnectAttempts = 0;

    socketSendJson('set-client-patch', {
      type: 'ontime',
      origin: window.location.origin,
      path: window.location.pathname + window.location.search,
    });
    setOnlineStatus(true);

    if (preferredClientName) {
      socketSendJson('set-client-name', preferredClientName);
    }
  };

  websocket.onclose = () => {
    console.warn('WebSocket disconnected');
    setOnlineStatus(false);

    // we decide to allows reconnect
    reconnectTimeout = setTimeout(() => {
      console.warn('WebSocket: attempting reconnect');
      if (websocket && websocket.readyState === WebSocket.CLOSED) {
        reconnectAttempts += 1;
        connectSocket();
      }
    }, reconnectInterval);
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
        case 'pong': {
          const offset = (new Date().getTime() - new Date(payload).getTime()) * 0.5;
          patchRuntimeProperty('ping', offset);
          updateDevTools({ ping: offset });
          break;
        }
        case 'client': {
          if (typeof payload === 'object' || payload !== null) {
            if (payload.clientId && payload.clientName) {
              setClientId(payload.clientId);
              if (!preferredClientName) {
                setClientName(payload.clientName);
              }
            }
          }
          break;
        }

        case 'client-rename': {
          if (typeof payload === 'object') {
            const id = getClientId();
            if (payload.target && payload.target === id) {
              setClientName(payload.name);
            }
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

        case 'dialog': {
          if (payload.dialog === 'welcome') {
            addDialog('welcome');
          }
          break;
        }

        case 'ontime-log': {
          addLog(payload as Log);
          break;
        }
        case 'ontime': {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- removing the key from the payload
          const { ping, ...serverPayload } = payload as Partial<RuntimeStore>;

          patchRuntime(serverPayload);
          updateDevTools(serverPayload);
          break;
        }
        case 'ontime-clock': {
          addToBatchUpdates('clock', payload);
          updateDevTools({ clock: payload });
          break;
        }
        case 'ontime-timer': {
          addToBatchUpdates('timer', payload);
          updateDevTools({ timer: payload });
          break;
        }
        case 'ontime-onAir': {
          addToBatchUpdates('onAir', payload);
          updateDevTools({ onAir: payload });
          break;
        }
        case 'ontime-message': {
          addToBatchUpdates('message', payload);
          updateDevTools({ message: payload });
          break;
        }
        case 'ontime-runtime': {
          addToBatchUpdates('runtime', payload);
          updateDevTools({ runtime: payload });
          break;
        }
        case 'ontime-eventNow': {
          addToBatchUpdates('eventNow', payload);
          updateDevTools({ eventNow: payload });
          break;
        }
        case 'ontime-currentBlock': {
          addToBatchUpdates('currentBlock', payload);
          updateDevTools({ currentBlock: payload });
          break;
        }
        case 'ontime-publicEventNow': {
          addToBatchUpdates('publicEventNow', payload);
          updateDevTools({ publicEventNow: payload });
          break;
        }
        case 'ontime-eventNext': {
          addToBatchUpdates('eventNext', payload);
          updateDevTools({ eventNext: payload });
          break;
        }
        case 'ontime-publicEventNext': {
          addToBatchUpdates('publicEventNext', payload);
          updateDevTools({ publicEventNext: payload });
          break;
        }
        case 'ontime-auxtimer1': {
          addToBatchUpdates('auxtimer1', payload);
          updateDevTools({ auxtimer1: payload });
          break;
        }
        case 'ontime-refetch': {
          // the refetch message signals that the rundown has changed in the server side
          const { reload, target } = payload;
          if (reload) {
            invalidateAllCaches();
          } else if (target === 'RUNDOWN') {
            const { revision } = payload;
            const currentRevision = ontimeQueryClient.getQueryData<RundownCached>(RUNDOWN)?.revision ?? -1;
            if (revision > currentRevision) {
              ontimeQueryClient.invalidateQueries({ queryKey: RUNDOWN });
              ontimeQueryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS });
            }
          } else if (target === 'REPORT') {
            ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
          }
          break;
        }
        case 'ontime-flush': {
          flushBatchUpdates();
          break;
        }
      }
    } catch (_) {
      // ignore unhandled
    }
  };
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

/**
 * Allows setting the status of the client
 * We leverage the ping as an indication of the client's online status
 * @example ping < 0 - client is offline
 * @example ping > 0 -> client is online
 */
function setOnlineStatus(status: boolean) {
  const derivedPing = status ? 1 : -1;
  patchRuntimeProperty('ping', derivedPing);
  updateDevTools({ ping: derivedPing });
}
