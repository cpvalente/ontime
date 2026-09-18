import {
  ApiActionTag,
  Log,
  LogLevel,
  LogOrigin,
  MaybeNumber,
  MessageTag,
  RefetchKey,
  RuntimeStore,
  WsPacketToClient,
  WsPacketToServer,
} from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { isProduction, websocketUrl } from '../../externals';
import {
  APP_SETTINGS,
  CLIENT_LIST,
  CSS_OVERRIDE,
  CURRENT_RUNDOWN_QUERY_KEY,
  CUSTOM_FIELDS,
  PROJECT_DATA,
  REPORT,
  RUNDOWN,
  RUNTIME,
  TRANSLATION,
  URL_PRESETS,
  VIEW_SETTINGS,
  getRundownQueryKey,
  PROJECT_RUNDOWNS,
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
import { nowInMillis } from './time';

let websocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let watchdogInterval: NodeJS.Timeout | null = null;
export const socketConfig = {
  reconnectBaseInterval: 1000,
  reconnectMaxInterval: 30000,
  reconnectMinInterval: 500,
  reconnectJitter: 0.25,
  offlineAttemptsThreshold: 2,
  watchdogInterval: 2000,
  silenceTimeout: 10000,
  connectTimeout: 10000,
} as const;

export const getConnectionState = () => hasConnected;
export const getReconnectAttempts = () => reconnectAttempts;
let hasConnected = false;
let reconnectAttempts = 0;
let lastContact = 0;
let hasLoggedConnectionIssue = false;

export const connectSocket = () => {
  if (websocket && (websocket.readyState === WebSocket.CONNECTING || websocket.readyState === WebSocket.OPEN)) {
    return;
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  const socket = new WebSocket(websocketUrl);
  websocket = socket;
  registerConnectionAttempt();
  startWatchdog();

  const preferredClientName = getClientName();

  // Replaced sockets must not schedule reconnects for their replacement.
  const isCurrent = () => websocket === socket;

  socket.onopen = () => {
    if (!isCurrent()) {
      return;
    }
    const isReconnect = hasConnected;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    hasConnected = true;
    reconnectAttempts = 0;
    registerContact();

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

  socket.onclose = () => {
    if (!isCurrent()) {
      return;
    }
    console.warn('WebSocket disconnected');
    scheduleReconnect();
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onmessage = async (event) => {
    if (!isCurrent()) {
      return;
    }

    // Any server message proves the connection is still delivering.
    registerContact();

    try {
      const data = JSON.parse(event.data) as WsPacketToClient;

      const { tag, payload } = data;

      if (!tag) {
        return;
      }

      switch (tag) {
        case MessageTag.Pong: {
          // a round trip can be faster than the clock resolution, we keep the value positive since a ping <= 0 means offline
          const offset = Math.max(1, (new Date().getTime() - new Date(payload).getTime()) * 0.5);
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
          const { target, revision, rundownId } = payload;
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
              maybeInvalidateRundownCache(revision, rundownId);
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
            case RefetchKey.ProjectRundowns:
              ontimeQueryClient.invalidateQueries({ queryKey: PROJECT_RUNDOWNS });
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

function scheduleReconnect() {
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
    reconnectAttempts += 1;
    connectSocket();
  }, delay);
}

/** Drops a socket that is no longer delivering and retries with the normal backoff. */
function reconnectWithBackoff(reason: string) {
  logConnectionIssue(reason);
  detachSocket();
  scheduleReconnect();
}

/** Detaches a socket before closing it so late events cannot affect its replacement. */
function detachSocket() {
  const previous = websocket;
  websocket = null;

  if (!previous) {
    return;
  }

  previous.onopen = null;
  previous.onclose = null;
  previous.onerror = null;
  previous.onmessage = null;
  try {
    previous.close();
  } catch (_) {
    // The socket is unusable either way.
  }
}

function registerContact() {
  lastContact = Date.now();
  hasLoggedConnectionIssue = false;
}

function registerConnectionAttempt() {
  lastContact = Date.now();
}

/**
 * Replaces silent connections. The server publishes a clock update every second, even
 * while paused, so extended silence is evidence of a dropped connection.
 */
function checkConnection() {
  const silentFor = Date.now() - lastContact;

  if (websocket?.readyState === WebSocket.CONNECTING) {
    // A connection attempt can otherwise hang indefinitely.
    if (silentFor > socketConfig.connectTimeout) {
      reconnectWithBackoff('WebSocket: connection attempt timed out');
    }
    return;
  }

  if (websocket?.readyState === WebSocket.OPEN) {
    if (silentFor > socketConfig.silenceTimeout) {
      reconnectWithBackoff('WebSocket: no data from server, reconnecting');
    }
    return;
  }

  // Covers a close event that the browser never reported.
  if (!reconnectTimeout) {
    scheduleReconnect();
  }
}

function startWatchdog() {
  if (watchdogInterval) {
    return;
  }
  watchdogInterval = setInterval(checkConnection, socketConfig.watchdogInterval);
}

/** Records connection failures locally because server logs may be unreachable. */
function logConnectionIssue(text: string) {
  if (hasLoggedConnectionIssue) {
    return;
  }

  hasLoggedConnectionIssue = true;
  console.warn(text);
  addLog({
    id: generateId(),
    origin: LogOrigin.Client,
    time: millisToString(nowInMillis()),
    level: LogLevel.Warn,
    text,
  });
}

/** Rechecks a socket when a resumed browser may have lost it while timers were suspended. */
function handleEnvironmentChange() {
  if (!websocket || websocket.readyState === WebSocket.CLOSED || websocket.readyState === WebSocket.CLOSING) {
    // A pending reconnect may be delayed by backoff, so retry immediately.
    reconnectAttempts = 0;
    connectSocket();
    return;
  }

  checkConnection();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleEnvironmentChange);
  window.addEventListener('pageshow', handleEnvironmentChange);
  window.addEventListener('focus', handleEnvironmentChange);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleEnvironmentChange();
    }
  });
}

export function maybeInvalidateRundownCache(revision: MaybeNumber, rundownId?: string) {
  if (!rundownId) {
    // we omit rundownId to signify invalidate all rundowns
    ontimeQueryClient.invalidateQueries({ queryKey: RUNDOWN });
    ontimeQueryClient.invalidateQueries({ queryKey: CURRENT_RUNDOWN_QUERY_KEY, exact: true });
    return;
  }

  const queryKey = getRundownQueryKey(rundownId);
  const cachedRundown = ontimeQueryClient.getQueryData<{ revision: number }>(queryKey);

  // we already have this change, or something newer
  // messages can arrive after a refetch has already brought in a later revision
  if (revision !== null && cachedRundown !== undefined && revision <= cachedRundown.revision) {
    return;
  }

  ontimeQueryClient.invalidateQueries({ queryKey, exact: true });

  // keep current alias in sync with the ID-based cache
  const loadedRundownId = ontimeQueryClient.getQueryData<{ loaded: string }>(PROJECT_RUNDOWNS)?.loaded;
  if (!loadedRundownId || loadedRundownId === rundownId) {
    ontimeQueryClient.invalidateQueries({ queryKey: CURRENT_RUNDOWN_QUERY_KEY, exact: true });
  }
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
