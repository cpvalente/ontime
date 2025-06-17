import { useCallback } from 'react';
import { Log, LogLevel, LogOrigin, MessageType } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { sendSocket } from '../utils/socket';
import { nowInMillis } from '../utils/time';

type LogStore = {
  logs: Log[];
};

const logger = createStore<LogStore>(() => ({
  logs: [],
}));

export const useLogData = () => useStore(logger);

export const addLog = (log: Log) =>
  logger.setState((state) => ({
    logs: [log, ...state.logs],
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

    sendSocket(MessageType.Log, log);
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
