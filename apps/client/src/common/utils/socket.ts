import { Log, Rundown, RuntimeStore, WebSocketPacketToClient, WebSocketPacketToServer, WsType } from 'ontime-types';

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
import { patchRuntime, patchRuntimeProperty } from '../stores/runtime';

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

    sendOntimeSocket({
      type: WsType.CLIENT_SET,
      payload: {
        type: 'ontime',
        origin: window.location.origin,
        path: window.location.pathname + window.location.search,
        name: preferredClientName,
      },
    });

    setOnlineStatus(true);
  };

  websocket.onclose = () => {
    console.warn('WebSocket disconnected');

    // we decide to allows reconnect
    reconnectTimeout = setTimeout(() => {
      if (reconnectAttempts > 2) {
        setOnlineStatus(false);
      }
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
      const data = JSON.parse(event.data) as WebSocketPacketToClient;

      const { type, payload } = data;

      if (!type) {
        return;
      }

      switch (type) {
        case WsType.PONG: {
          const offset = (new Date().getTime() - new Date(payload).getTime()) * 0.5;
          patchRuntimeProperty('ping', offset);
          updateDevTools({ ping: offset });
          break;
        }
        case WsType.CLIENT_INIT: {
          setClientId(payload.clientId);
          if (!preferredClientName) {
            setClientName(payload.clientName);
          }
          break;
        }

        case WsType.CLIENT_RENAME: {
          const id = getClientId();
          if (payload.target === id) {
            setClientName(payload.name);
          }
          break;
        }

        case WsType.CLIENT_REDIRECT: {
          const id = getClientId();
          if (payload.target === id) {
            setClientRedirect(payload.path);
          }
          break;
        }

        case WsType.CLIENT_LIST: {
          setClients(payload);
          if (!isProduction) {
            ontimeQueryClient.setQueryData(CLIENT_LIST, payload);
          }
          break;
        }

        case WsType.DIALOG: {
          if (payload.dialog === 'welcome') {
            addDialog('welcome');
          }
          break;
        }

        case WsType.ONTIME_LOG: {
          addLog(payload as Log);
          break;
        }
        case WsType.ONTIME: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- removing the key from the payload
          const { ping, ...serverPayload } = payload;
          patchRuntime(serverPayload);
          updateDevTools(serverPayload);
          break;
        }
        case WsType.ONTIME_PATCH: {
          const patch = payload;
          patchRuntime(patch);
          updateDevTools(patch);
          break;
        }
        case WsType.ONTIME_REFETCH: {
          // the refetch message signals that the rundown has changed in the server side
          const { reload, target } = payload;
          if (reload) {
            invalidateAllCaches();
          } else if (target === 'RUNDOWN') {
            const { revision } = payload;
            const currentRevision = ontimeQueryClient.getQueryData<Rundown>(RUNDOWN)?.revision ?? -1;
            if (!revision || revision > currentRevision) {
              ontimeQueryClient.invalidateQueries({ queryKey: RUNDOWN });
              ontimeQueryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS });
            }
          } else if (target === 'REPORT') {
            ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
          }
          break;
        }
        default: {
          console.log('unknown WS message', type);
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

export function sendOntimeSocket(packet: WebSocketPacketToServer): void {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(packet));
  }
}

export function socketSendJson(type: string, payload?: unknown): void {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ type, payload }));
  }
}

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
