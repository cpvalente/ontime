import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';

import { generateId } from '../utils/generate_id';
import { nowInMillis, stringFromMillis } from '../utils/time';

import { useSocket } from './socketContext';

type LOG_LEVEL = 'INFO' | 'WARN' | 'ERROR';
type Log = {
  id: string;
  origin: string;
  time: string;
  level: LOG_LEVEL;
  text: string;
};

interface LoggingProviderState {
  logData: Log[];
  emitInfo: (text: string) => void;
  emitWarning: (text: string) => void;
  emitError: (text: string) => void;
  clearLog: () => void;
}

type LoggingProviderProps = {
  children: ReactNode
}

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
  const socket = useSocket();
  const [logData, setLogData] = useState<Log[]>([]);
  const origin = 'USER';

  // handle incoming messages
  useEffect(() => {
    if (socket == null) return;

    // Ask for log data
    socket.emit('get-logger');

    socket.on('logger', (data: Log) => {
      setLogData((currentLog) => [data, ...currentLog]);
    });

    // Clear listener
    return () => {
      socket.off('logger');
    };
  }, [socket]);

  /**
   * Utility function sends message over socket
   * @param text
   * @param level
   * @private
   */
  const _send = useCallback(
    (text: string, level: LOG_LEVEL) => {
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
    [logData.length, setLogData, socket],
  );

  /**
   * Sends a message with level INFO
   * @param text
   */
  const emitInfo = useCallback(
    (text: string) => {
      _send(text, 'INFO');
    },
    [_send],
  );

  /**
   * Sends a message with level WARN
   * @param text
   */
  const emitWarning = useCallback(
    (text: string) => {
      _send(text, 'WARN');
    },
    [_send],
  );

  /**
   * Sends a message with level ERROR
   * @param text
   */
  const emitError = useCallback(
    (text: string) => {
      _send(text, 'ERROR');
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
