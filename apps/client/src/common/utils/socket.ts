import {
  ApiActionTag,
  Log,
  MaybeNumber,
  MessageTag,
  ProjectRundownsList,
  RefetchKey,
  Rundown,
  RuntimeStore,
  WsPacketToClient,
  WsPacketToServer,
} from 'ontime-types';

import { isProduction, websocketUrl } from '../../externals';
import {
  APP_SETTINGS,
  CLIENT_LIST,
  CSS_OVERRIDE,
  CUSTOM_FIELDS,
  PROJECT_DATA,
  CURRENT_RUNDOWN_QUERY_KEY,
  PROJECT_RUNDOWNS,
  REPORT,
  RUNTIME,
  TRANSLATION,
  URL_PRESETS,
  VIEW_SETTINGS,
  getRundownQueryKey,
} from '../api/constants';
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
const socketConfig = {
  reconnectBaseInterval: 1000, // 1 second
  reconnectMaxInterval: 30000, // 30 seconds
  reconnectMinInterval: 500, // 0.5 seconds
  reconnectJitter: 0.25,
  offlineAttemptsThreshold: 2, // when we consider the client disconnected
} as const;

export let hasConnected = false;
export let reconnectAttempts = 0;

export const connectSocket = () => {
  websocket = new WebSocket(websocketUrl);

  const preferredClientName = getClientName();

  websocket.onopen = () => {
    const isReconnect = hasConnected;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    hasConnected = true;
    reconnectAttempts = 0;

    sendSocket(MessageTag.ClientSet, {
      type: 'ontime',
      origin: window.location.origin,
      path: window.location.pathname + window.location.search,
      name: preferredClientName,
    });

    if (isReconnect) {
      invalidateAllCaches();
    }
    setOnlineStatus(true);
  };

  websocket.onclose = () => {
    console.warn('WebSocket disconnected');
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    const exponentialDelay = Math.min(
      socketConfig.reconnectBaseInterval * 2 ** reconnectAttempts,
      socketConfig.reconnectMaxInterval,
    );
    const jitterOffset = exponentialDelay * socketConfig.reconnectJitter * (Math.random() * 2 - 1);
    const delay = Math.max(socketConfig.reconnectMinInterval, Math.round(exponentialDelay + jitterOffset));

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      if (reconnectAttempts > socketConfig.offlineAttemptsThreshold) {
        setOnlineStatus(false);
      }
      console.warn(`WebSocket: reconnecting now (#${reconnectAttempts + 1}, waited ${delay}ms)`);
      if (websocket && websocket.readyState === WebSocket.CLOSED) {
        reconnectAttempts += 1;
        connectSocket();
      }
    }, delay);
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
          patchRuntime(payload);
          updateDevTools(payload);
          break;
        }
        case MessageTag.Refetch: {
          // the refetch message signals that the rundown has changed in the server side
          const { target, revision } = payload;
          switch (target) {
            case RefetchKey.All:
              invalidateAllCaches();
              break;
            case RefetchKey.CustomFields:
              ontimeQueryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS });
              break;
            case RefetchKey.ProjectData:
              ontimeQueryClient.invalidateQueries({ queryKey: PROJECT_DATA });
              break;
            case RefetchKey.Report:
              ontimeQueryClient.invalidateQueries({ queryKey: REPORT });
              break;
            case RefetchKey.Rundown: {
              maybeInvalidateRundownCache(revision);
              break;
            }
            case RefetchKey.UrlPresets:
              ontimeQueryClient.invalidateQueries({ queryKey: URL_PRESETS });
              break;
            case RefetchKey.ViewSettings:
              ontimeQueryClient.invalidateQueries({ queryKey: VIEW_SETTINGS });
              break;
            case RefetchKey.CssOverride:
              ontimeQueryClient.invalidateQueries({ queryKey: CSS_OVERRIDE });
              break;
            case RefetchKey.Translation:
              ontimeQueryClient.invalidateQueries({ queryKey: TRANSLATION });
              break;
            case RefetchKey.Settings:
              ontimeQueryClient.invalidateQueries({ queryKey: APP_SETTINGS });
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

/**
 * When we receive a refetch message for the rundown
 * check which rundown needs to be invalidated
 */
export function maybeInvalidateRundownCache(revision: MaybeNumber) {
  const loadedRundownId: string | undefined = (ontimeQueryClient.getQueryData(PROJECT_RUNDOWNS) as ProjectRundownsList)
    ?.loaded;

  const activeRundownQueryKey = loadedRundownId ? getRundownQueryKey(loadedRundownId) : CURRENT_RUNDOWN_QUERY_KEY;
  const cachedRundown = ontimeQueryClient.getQueryData<Rundown>(activeRundownQueryKey);
  if (revision === cachedRundown?.revision) {
    return;
  }

  ontimeQueryClient.invalidateQueries({ queryKey: activeRundownQueryKey, exact: true });

  if (loadedRundownId) {
    // Keep bootstrap alias in sync with the ID-based cache
    ontimeQueryClient.invalidateQueries({ queryKey: CURRENT_RUNDOWN_QUERY_KEY, exact: true });
  } else {
    // During bootstrap, loadedRundownId is not yet known.
    // Invalidate any ID-based rundown caches that may have been seeded early.
    ontimeQueryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'rundown' && query.queryKey[1] !== 'current',
    });
  }

  ontimeQueryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS });
}

export function sendSocket<T extends MessageTag | ApiActionTag>(
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
