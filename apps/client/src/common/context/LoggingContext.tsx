import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { Log, LogLevel } from 'ontime-types';
import { generateId } from 'ontime-utils';

import socket from '../utils/socket';
import { nowInMillis, stringFromMillis } from '../utils/time';

interface LoggingProviderState {
  logData: Log[];
  emitInfo: (text: string) => void;
  emitWarning: (text: string) => void;
  emitError: (text: string) => void;
  clearLog: () => void;
}

type LoggingProviderProps = {
  children: ReactNode;
};

const notInitialised = () => {
  throw new Error('Not initialised');
};

export const LoggingContext = createContext<LoggingProviderState>({
  logData: [],
  emitInfo: notInitialised,
  emitWarning: notInitialised,
  emitError: notInitialised,
  clearLog: notInitialised,
});

export const LoggingProvider = ({ children }: LoggingProviderProps) => {
  const MAX_MESSAGES = 100;
  const [logData, setLogData] = useState<Log[]>([]);
  const origin = 'USER';

  // todo: use react-query store
  // todo: useSubscription or feature
  // handle incoming messages
  useEffect(() => {
    socket.emit('get-logger');

    socket.on('logger', (data: Log) => {
      setLogData((currentLog) => [data, ...currentLog]);
    });

    // Clear listener
    return () => {
      socket.off('logger');
    };
  }, []);

  /**
   * Utility function sends message over socket
   * @param text
   * @param level
   * @private
   */
  const _send = useCallback(
    (text: string, level: LogLevel) => {
      if (socket != null) {
        const newLogMessage: Log = {
          id: generateId(),
          origin,
          time: stringFromMillis(nowInMillis()),
          level,
          text,
        };
        setLogData((currentLog) => [newLogMessage, ...currentLog]);
        socket.emit('logger', newLogMessage);
      }
      if (logData.length > MAX_MESSAGES) {
        setLogData((currentLog) => currentLog.slice(1));
      }
    },
    [logData.length, setLogData],
  );

  /**
   * Sends a message with level INFO
   * @param text
   */
  const emitInfo = useCallback(
    (text: string) => {
      _send(text, LogLevel.Info);
    },
    [_send],
  );

  /**
   * Sends a message with level WARN
   * @param text
   */
  const emitWarning = useCallback(
    (text: string) => {
      _send(text, LogLevel.Warn);
    },
    [_send],
  );

  /**
   * Sends a message with level ERROR
   * @param text
   */
  const emitError = useCallback(
    (text: string) => {
      _send(text, LogLevel.Error);
    },
    [_send],
  );

  /**
   * Clears running log
   */
  const clearLog = useCallback(() => {
    setLogData([]);
  }, [setLogData]);

  return (
    <LoggingContext.Provider value={{ emitInfo, logData, emitWarning, emitError, clearLog }}>
      {children}
    </LoggingContext.Provider>
  );
};
