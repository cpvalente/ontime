import { Instant, Log, LogLevel, LogOrigin, MessageTag, logHistorySize } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';
import { useCallback } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { sendSocket } from '../utils/socket';
import { nowInMillis } from '../utils/time';

type LogStore = {
  logs: Log[];
};

export const logStore = createStore<LogStore>(() => ({
  logs: [],
}));

export const useLogData = () => useStore(logStore);

export const addLog = (log: Log) =>
  logStore.setState((state) => ({
    logs: [log, ...state.logs].slice(0, logHistorySize),
  }));

/**
 * Adds the entries the server kept before we connected
 * a reconnecting client already has some, and may have local entries the server never saw
 */
export const addLogHistory = (history: Log[]) =>
  logStore.setState((state) => {
    const known = new Set(state.logs.map((log) => log.id));
    const missing = history.filter((log) => !known.has(log.id));
    const logs = [...state.logs, ...missing].sort((a, b) => b.at - a.at);
    return { logs: logs.slice(0, logHistorySize) };
  });

/** Creates an entry on this client */
export function createLog(origin: string, level: LogLevel, text: string): Log {
  return {
    id: generateId(),
    origin,
    at: Date.now() as Instant,
    time: millisToString(nowInMillis()),
    level,
    text,
  };
}

export const clearLogs = () => logStore.setState({ logs: [] });

export function useEmitLog() {
  /**
   * Utility function sends message over socket
   * @param text
   * @param level
   * @private
   */
  const _emit = useCallback((text: string, level: LogLevel) => {
    // the server stamps its own id and time
    sendSocket(MessageTag.Log, createLog(LogOrigin.Client, level, text));
  }, []);

  /**
   * Sends a message with level INFO
   * @param text
   */
  const emitInfo = useCallback(
    (text: string) => {
      _emit(text, LogLevel.Info);
    },
    [_emit],
  );

  /**
   * Sends a message with level WARN
   * @param text
   */
  const emitWarning = useCallback(
    (text: string) => {
      _emit(text, LogLevel.Warn);
    },
    [_emit],
  );

  /**
   * Sends a message with level ERROR
   * @param text
   */
  const emitError = useCallback(
    (text: string) => {
      _emit(text, LogLevel.Error);
    },
    [_emit],
  );

  return {
    emitInfo,
    emitWarning,
    emitError,
  };
}
