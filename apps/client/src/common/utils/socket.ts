import {
  ApiAction,
  Log,
  MessageTag,
  RefetchKey,
  Rundown,
  RuntimeStore,
  WsPacketToClient,
  WsPacketToServer,
} from 'ontime-types';

import { isProduction, websocketUrl } from '../../externals';
import { CLIENT_LIST, CUSTOM_FIELDS, REPORT, RUNDOWN, RUNTIME, VIEW_SETTINGS } from '../api/constants';
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

    sendSocket(MessageTag.ClientSet, {
      type: 'ontime',
      origin: window.location.origin,
      path: window.location.pathname + window.location.search,
      name: preferredClientName,
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

  websocket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data) as WsPacketToClient;

      const { tag, payload } = data;

      if (!tag) {
        return;
      }

      switch (tag) {
        case MessageTag.Pong: {
          const offset = (new Date().getTime() - new Date(payload).getTime()) * 0.5;
          patchRuntimeProperty('ping', offset);
          updateDevTools({ ping: offset });
          break;
        }
        case MessageTag.ClientInit: {
          setClientId(payload.clientId);
          if (!preferredClientName) {
            setClientName(payload.clientName);
          }
          break;
        }

        case MessageTag.ClientRename: {
          const id = getClientId();
          if (payload.target === id) {
            setClientName(payload.name);
          }
          break;
        }

        case MessageTag.ClientRedirect: {
          const id = getClientId();
          if (payload.target === id) {
            setClientRedirect(payload.path);
          }
          break;
        }

        case MessageTag.ClientList: {
          setClients(payload);
          if (!isProduction) {
            ontimeQueryClient.setQueryData(CLIENT_LIST, payload);
          }
          break;
        }

        case MessageTag.Dialog: {
          if (payload.dialog === 'welcome') {
            addDialog('welcome');
          }
          break;
        }

        case MessageTag.Log: {
          addLog(payload as Log);
          break;
        }
        case MessageTag.RuntimeData: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- removing the key from the payload
          const { ping, ...serverPayload } = payload;
          patchRuntime(serverPayload);
          updateDevTools(serverPayload);
          break;
        }
        case MessageTag.RuntimePatch: {
          const patch = payload;
          patchRuntime(patch);
          updateDevTools(patch);
          break;
        }
        case MessageTag.Refetch: {
          // the refetch message signals that the rundown has changed in the server side
          const { target, revision } = payload;
          switch (target) {
            case RefetchKey.All:
              invalidateAllCaches();
              break;
            case RefetchKey.Rundown:
              if (revision === (ontimeQueryClient.getQueryData(RUNDOWN) as Rundown).revision) break;
              ontimeQueryClient.invalidateQueries({ queryKey: RUNDOWN });
              ontimeQueryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS });
              break;
            case RefetchKey.ViewSettings:
              ontimeQueryClient.invalidateQueries({ queryKey: VIEW_SETTINGS });
              break;
            case RefetchKey.Report:
              ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
              break;
            default: {
              target satisfies never;
              break;
            }
          }
          break;
        }
        default: {
          tag satisfies never;
          break;
        }
      }
    } catch (_) {
      // ignore unhandled
    }
  };
};

export function sendSocket<T extends MessageTag | ApiAction>(
  tag: T,
  payload: T extends MessageTag ? Pick<WsPacketToServer & { tag: T }, 'payload'>['payload'] : unknown,
): void {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ tag, payload }));
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
