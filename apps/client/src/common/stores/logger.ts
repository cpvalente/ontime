import { useCallback, useSyncExternalStore } from 'react';
import { Log, LogLevel } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { socketSendJson } from '../utils/socket';
import { nowInMillis, stringFromMillis } from '../utils/time';

import createStore from './createStore';

export const logger = createStore<Log[]>([]);
export const LOGGER_MAX_MESSAGES = 100;

export function useEmitLog() {
  const _addToLogger = (log: Log) => {
    const state = logger.get();
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

    _addToLogger(log);
    socketSendJson('ontime-log', log);
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
    logger.set([]);
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
