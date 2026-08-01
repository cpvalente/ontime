import { Log, LogLevel, LogOrigin, MessageTag } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';
import { useCallback } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { sendSocket } from '../utils/socket';
import { nowInMillis } from '../utils/time';

type LogStore = {
  logs: Log[];
};

/**
 * Ontime clients can be left running for days, and a busy integration generates
 * a steady stream of entries. We keep a bounded window so the store cannot grow
 * without limit; the full server-side history remains available in the log view.
 */
const maxLogEntries = 500;

const logger = createStore<LogStore>(() => ({
  logs: [],
}));

export const useLogData = () => useStore(logger);

export const addLog = (log: Log) =>
  logger.setState((state) => ({
    logs: [log, ...state.logs].slice(0, maxLogEntries),
  }));

export const clearLogs = () => logger.setState({ logs: [] });

export function useEmitLog() {
  /**
   * Utility function sends message over socket
   * @param text
   * @param level
   * @private
   */
  const _emit = useCallback((text: string, level: LogLevel) => {
    const log = {
      id: generateId(),
      origin: LogOrigin.Client,
      time: millisToString(nowInMillis()),
      level,
      text,
    };

    sendSocket(MessageTag.Log, log);
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
