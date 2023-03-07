import { useCallback, useSyncExternalStore } from 'react';
import useWebSocket from 'react-use-websocket';
import { Log, LogLevel, LogMessage } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { nowInMillis, stringFromMillis } from '../utils/time';

import createStore from './createStore';

export const logger = createStore<Log[]>([]);
export const LOGGER_MAX_MESSAGES = 100;

export function useEmitLog() {
  // should I just make my own ?
  const { sendJsonMessage } = useWebSocket('ws://localhost:4001/ws', {
    share: true,
    shouldReconnect: () => true,
  });

  const _addToLogger = (log: Log) => {
    const state = logger.get();
    console.log('DEBUG', state);
    state.push(log);
    if (state.length > LOGGER_MAX_MESSAGES) {
      state.slice(1);
    }
    logger.set(state);
  };

  /**
   * Utility function sends message over socket
   * @param text
   * @param level
   * @private
   */
  const _emit = (text: string, level: LogLevel) => {
    const log = {
      id: generateId(),
      origin: 'CLIENT',
      time: stringFromMillis(nowInMillis()),
      level,
      text,
    };

    const logMessage: LogMessage = {
      type: 'ontime-log',
      payload: log,
    };
    _addToLogger(log);
    sendJsonMessage(logMessage);
  };

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

  const clearLog = useCallback(() => {
    throw new Error('NOT IMPLEMENTED CLEAR LOG');
  }, []);

  return {
    emitInfo,
    emitWarning,
    emitError,
    clearLog,
  };
}

export const useLogData = () => {
  return useSyncExternalStore(logger.subscribe, () => logger.get());
};
